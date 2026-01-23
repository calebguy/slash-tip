import { Hono } from "hono";
import { erc20Abi, type Hex } from "viem";
import {
	setBaseURIViaSyndicate,
	setContractURIViaSyndicate,
} from "../chain";
import { handleChatMessage } from "../chat";
import {
	deployERC1155,
	deployERC20,
	deployERC20Vault,
	getOrgAddressesFromTx,
} from "../deploy/factory";
import { env } from "../env";
import {
	downloadFromSlack,
	getContentType,
	getFileExtension,
	uploadToS3,
} from "../s3";
import { db } from "../server";
import {
	publishAppHome,
	openTokenTypeModal,
	getERC1155ConfigView,
	getERC20ConfigView,
	getERC20VaultConfigView,
	getMetadataEditView,
} from "../slack/appHome";
import { isPureCommand } from "../utils";
import { baseClient } from "../viem";

/**
 * Helper to fetch org addresses from tx with retries (for propagation delay)
 */
async function fetchOrgAddressesWithRetry(txHash: string, maxAttempts = 5, delayMs = 2000) {
	for (let i = 0; i < maxAttempts; i++) {
		const addresses = await getOrgAddressesFromTx(txHash);
		if (addresses) {
			return addresses;
		}
		console.log(`Attempt ${i + 1}/${maxAttempts}: Transaction not confirmed yet, waiting...`);
		await new Promise((resolve) => setTimeout(resolve, delayMs));
	}
	return null;
}

interface SlackEvent {
	type: string;
	user: string;
	channel?: string;
	tab?: string;
	event_ts?: string;
	text?: string;
	channel_type?: string;
	bot_id?: string;
	subtype?: string;
}

interface SlackEventPayload {
	type: string;
	token?: string;
	challenge?: string;
	team_id?: string;
	event?: SlackEvent;
}

interface SlackFileObject {
	id: string;
	name: string;
	url_private: string;
	url_private_download: string;
	mimetype: string;
}

interface SlackInteractionPayload {
	type: string;
	user: { id: string };
	team: { id: string };
	trigger_id: string;
	actions?: Array<{ action_id: string; value?: string }>;
	view?: {
		callback_id: string;
		state: {
			values: Record<
				string,
				Record<
					string,
					{
						value?: string;
						selected_option?: { value: string };
						files?: SlackFileObject[];
					}
				>
			>;
		};
		private_metadata?: string;
	};
}

const app = new Hono()
	/**
	 * POST /events
	 * Handles Slack Events API (app_home_opened, etc.)
	 */
	.post("/", async (c) => {
		const body = await c.req.json<SlackEventPayload>();

		// Handle URL verification challenge
		if (body.type === "url_verification") {
			return c.json({ challenge: body.challenge });
		}

		// Handle events
		if (body.type === "event_callback" && body.event) {
			const event = body.event;
			const teamId = body.team_id;

			if (event.type === "app_home_opened" && teamId) {
				const [org] = await db.getOrgBySlackTeamId(teamId);

				if (event.tab === "home" && org?.slackBotToken) {
					console.log(`App home opened by ${event.user} in team ${teamId}`);
					await publishAppHome(org, event.user);
				}

				if (event.tab === "messages" && org?.slackBotToken) {
					// Check if user has already received welcome message
					const alreadySent = await db.hasReceivedWelcomeMessage(event.user, org.id);

					if (!alreadySent) {
						console.log(`Sending welcome message to ${event.user} in team ${teamId}`);
						await fetch("https://slack.com/api/chat.postMessage", {
							method: "POST",
							headers: {
								Authorization: `Bearer ${org.slackBotToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								channel: event.user,
								text: "Welcome to /tip! Head over to the *Home* tab above to configure tipping for your workspace, or use `/tip @user` in any channel to send tips.\n\nYou can also ask me questions about how to use /tip - just type a message here!",
							}),
						});

						// Mark as sent so we don't send again
						await db.markWelcomeMessageSent(event.user, org.id);
					}
				}
			}

			// Handle DM messages (chat assistant)
			if (event.type === "message" && event.channel_type === "im" && teamId) {
				// Ignore bot messages and message subtypes (edits, deletes, etc.)
				if (event.bot_id || event.subtype) {
					return c.json({ ok: true });
				}

				const [org] = await db.getOrgBySlackTeamId(teamId);

				if (org?.slackBotToken && event.text && event.channel) {
					console.log(`DM received from ${event.user}: ${event.text.substring(0, 50)}...`);

					// Skip processing if message is a pure command (e.g., "/balance", "/tip @user 10")
					if (isPureCommand(event.text)) {
						console.log(`Ignoring pure command in DM: ${event.text}`);
						return c.json({ ok: true });
					}

					// Process chat asynchronously to avoid Slack 3s timeout
					(async () => {
						try {
							const response = await handleChatMessage(event.text!, {
								org,
								userId: event.user,
							});

							await fetch("https://slack.com/api/chat.postMessage", {
								method: "POST",
								headers: {
									Authorization: `Bearer ${org.slackBotToken}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									channel: event.channel,
									text: response,
								}),
							});
						} catch (error) {
							console.error("Error handling chat message:", error);
							await fetch("https://slack.com/api/chat.postMessage", {
								method: "POST",
								headers: {
									Authorization: `Bearer ${org.slackBotToken}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									channel: event.channel,
									text: "Sorry, I encountered an error processing your message. Please try again.",
								}),
							});
						}
					})();
				}
			}
		}

		return c.json({ ok: true });
	})

	/**
	 * POST /interactions
	 * Handles Slack interactive components (buttons, modals)
	 */
	.post("/interactions", async (c) => {
		const formData = await c.req.formData();
		const payloadStr = formData.get("payload") as string;
		const payload: SlackInteractionPayload = JSON.parse(payloadStr);

		console.log("Interaction received:", payload.type);

		const teamId = payload.team.id;
		const [org] = await db.getOrgBySlackTeamId(teamId);

		if (!org?.slackBotToken) {
			console.error("No org or bot token found for team:", teamId);
			return c.json({ ok: false });
		}

		// Handle button clicks
		if (payload.type === "block_actions" && payload.actions) {
			const action = payload.actions[0];

			if (action.action_id === "setup_start") {
				await openTokenTypeModal(org, payload.trigger_id);
			}
		}

		// Handle modal submissions
		if (payload.type === "view_submission" && payload.view) {
			const callbackId = payload.view.callback_id;
			const values = payload.view.state.values;

			// Token type selection - return next view in response to avoid trigger_id expiration
			if (callbackId === "token_type_select") {
				const tokenType = values.token_type?.token_type_select?.selected_option?.value;

				let nextView;
				if (tokenType === "erc1155") {
					nextView = getERC1155ConfigView();
				} else if (tokenType === "erc20") {
					nextView = getERC20ConfigView();
				} else if (tokenType === "erc20_vault") {
					nextView = getERC20VaultConfigView();
				}

				if (nextView) {
					// Return response_action: push to push the next modal onto the stack
					return c.json({ response_action: "push", view: nextView });
				}

				return c.body(null, 200);
			}

			// ERC1155 config submission
			if (callbackId === "erc1155_config") {
				const tokenId = values.token_id?.token_id_input?.value || "0";
				const dailyAllowance = values.daily_allowance?.daily_allowance_input?.value || "3";

				// Use server metadata endpoint as baseUri
				const baseUri = `${env.PUBLIC_URL}/metadata/${org.slug}/`;
				const contractUri = `${env.PUBLIC_URL}/metadata/${org.slug}/contract`;

				console.log("Deploying ERC1155 setup:", { baseUri, contractUri, tokenId, dailyAllowance });

				// Process deployment asynchronously to avoid Slack 3s timeout
				(async () => {
					const deployResult = await deployERC1155({
						orgId: org.id,
						baseUri,
						contractUri,
						tokenId: Number(tokenId),
					});

					if (!deployResult.success) {
						console.error("ERC1155 deployment failed:", deployResult.error);
					}

					// Fetch deployed addresses from transaction receipt
					let addresses = null;
					if (deployResult.success && deployResult.transactionHash) {
						addresses = await fetchOrgAddressesWithRetry(deployResult.transactionHash);
						if (!addresses) {
							console.error("Failed to fetch deployed addresses from tx:", deployResult.transactionHash);
						}
					}

					// Update org config with addresses and set admin
					const [updatedOrg] = await db.updateOrg(org.id, {
						adminUserId: payload.user.id,
						actionType: "erc1155_mint",
						actionConfig: {
							baseUri,
							contractUri,
							tokenId: Number(tokenId),
							deploymentTxHash: deployResult.transactionHash,
							deploymentStatus: addresses ? "deployed" : "pending",
							slashTipAddress: addresses?.slashTipAddress,
							userRegistryAddress: addresses?.userRegistryAddress,
							tipActionAddress: addresses?.tipActionAddress,
							tipTokenAddress: addresses?.tipTokenAddress,
						},
						dailyAllowance: Number(dailyAllowance),
					});

					// Create default token metadata
					await db.upsertTokenMetadata(org.id, Number(tokenId), {
						name: `${org.name} Tip`,
						description: `A tip token for ${org.name}`,
						image: org.logoUrl || "",
					});

					// Refresh app home with updated org
					await publishAppHome(updatedOrg || org, payload.user.id);
				})();

				// Clear entire modal stack (not just top modal)
				return c.json({ response_action: "clear" });
			}

			// ERC20 config submission
			if (callbackId === "erc20_config") {
				const tokenName = values.token_name?.token_name_input?.value || "";
				const tokenSymbol = values.token_symbol?.token_symbol_input?.value || "";
				const decimals = values.decimals?.decimals_input?.value || "18";
				const dailyAllowance = values.daily_allowance?.daily_allowance_input?.value || "3";

				console.log("Deploying ERC20 setup:", { tokenName, tokenSymbol, decimals, dailyAllowance });

				// Process deployment asynchronously to avoid Slack 3s timeout
				(async () => {
					const deployResult = await deployERC20({
						orgId: org.id,
						tokenName,
						tokenSymbol,
						decimals: Number(decimals),
					});

					if (!deployResult.success) {
						console.error("ERC20 deployment failed:", deployResult.error);
					}

					// Fetch deployed addresses from transaction receipt
					let addresses = null;
					if (deployResult.success && deployResult.transactionHash) {
						addresses = await fetchOrgAddressesWithRetry(deployResult.transactionHash);
						if (!addresses) {
							console.error("Failed to fetch deployed addresses from tx:", deployResult.transactionHash);
						}
					}

					// Update org config with addresses and set admin
					const [updatedOrg] = await db.updateOrg(org.id, {
						adminUserId: payload.user.id,
						actionType: "erc20_mint",
						actionConfig: {
							tokenName,
							tokenSymbol,
							decimals: Number(decimals),
							deploymentTxHash: deployResult.transactionHash,
							deploymentStatus: addresses ? "deployed" : "pending",
							slashTipAddress: addresses?.slashTipAddress,
							userRegistryAddress: addresses?.userRegistryAddress,
							tipActionAddress: addresses?.tipActionAddress,
							tipTokenAddress: addresses?.tipTokenAddress,
						},
						dailyAllowance: Number(dailyAllowance),
					});

					// Refresh app home with updated org
					await publishAppHome(updatedOrg || org, payload.user.id);
				})();

				// Clear entire modal stack (not just top modal)
				return c.json({ response_action: "clear" });
			}

			// ERC20 Vault config submission
			if (callbackId === "erc20_vault_config") {
				const tokenAddress = values.token_address?.token_address_input?.value || "";
				const vaultManagerWallet = values.admin_wallet?.admin_wallet_input?.value || "";
				const dailyAllowance = values.daily_allowance?.daily_allowance_input?.value || "3";

				// Validate vault manager address is provided
				if (!vaultManagerWallet) {
					return c.json({
						response_action: "errors",
						errors: {
							admin_wallet: "A vault manager wallet address is required for fund recovery",
						},
					});
				}

				console.log("Deploying ERC20 Vault setup:", { tokenAddress, vaultManagerWallet, dailyAllowance });

				// Process deployment asynchronously to avoid Slack 3s timeout
				(async () => {
					// Fetch token decimals from the ERC20 contract
					let decimals = 18;
					try {
						decimals = await baseClient.readContract({
							address: tokenAddress as Hex,
							abi: erc20Abi,
							functionName: "decimals",
						});
					} catch (e) {
						console.error("Failed to fetch token decimals, defaulting to 18:", e);
					}

					const deployResult = await deployERC20Vault({
						orgId: org.id,
						tokenAddress,
						vaultManagerAddress: vaultManagerWallet,
					});

					if (!deployResult.success) {
						console.error("ERC20 Vault deployment failed:", deployResult.error);
					}

					// Fetch deployed addresses from transaction receipt
					let addresses = null;
					if (deployResult.success && deployResult.transactionHash) {
						addresses = await fetchOrgAddressesWithRetry(deployResult.transactionHash);
						if (!addresses) {
							console.error("Failed to fetch deployed addresses from tx:", deployResult.transactionHash);
						}
					}

					// Update org config with addresses and set admin
					const [updatedOrg] = await db.updateOrg(org.id, {
						adminUserId: payload.user.id,
						actionType: "erc20_vault",
						actionConfig: {
							tokenAddress,
							decimals,
							vaultManagerAddress: vaultManagerWallet,
							deploymentTxHash: deployResult.transactionHash,
							deploymentStatus: addresses ? "deployed" : "pending",
							slashTipAddress: addresses?.slashTipAddress,
							userRegistryAddress: addresses?.userRegistryAddress,
							tipActionAddress: addresses?.tipActionAddress,
							tipTokenAddress: addresses?.tipTokenAddress,
						},
						dailyAllowance: Number(dailyAllowance),
					});

					// Refresh app home with updated org
					await publishAppHome(updatedOrg || org, payload.user.id);
				})();

				// Clear entire modal stack (not just top modal)
				return c.json({ response_action: "clear" });
			}

			// Metadata edit submission
			if (callbackId === "metadata_edit") {
				const privateMetadata = payload.view.private_metadata
					? JSON.parse(payload.view.private_metadata)
					: {};
				const tokenId = privateMetadata.tokenId ?? 0;

				// Verify user is admin
				if (org.adminUserId !== payload.user.id) {
					return c.json({
						response_action: "errors",
						errors: {
							name_block: "Only the workspace admin can edit metadata.",
						},
					});
				}

				const name = values.name_block?.name_input?.value || "";
				const description = values.description_block?.description_input?.value || "";
				const files = values.image_block?.image_input?.files;

				// Get token address from config
				const config = org.actionConfig as { tipTokenAddress?: string } | null;
				const tipTokenAddress = config?.tipTokenAddress;

				// Process asynchronously to handle image upload and on-chain updates
				(async () => {
					let imageUrl = "";

					// If a file was uploaded, download from Slack and upload to S3
					if (files && files.length > 0) {
						const file = files[0];
						console.log(`Processing file upload:`, {
							name: file.name,
							mimetype: file.mimetype,
							url_private: file.url_private?.substring(0, 50) + "...",
							url_private_download: file.url_private_download?.substring(0, 50) + "...",
						});
						try {
							// Prefer url_private_download for actual file downloads
							const downloadUrl = file.url_private_download || file.url_private;
							const fileBuffer = await downloadFromSlack(downloadUrl, org.slackBotToken, file.id);
							console.log(`Downloaded file, size: ${fileBuffer.length} bytes`);

							const extension = getFileExtension(file.name);
							const contentType = file.mimetype || getContentType(extension);
							const s3Key = `${org.slug}/token-${tokenId}.${extension}`;
							imageUrl = await uploadToS3(s3Key, fileBuffer, contentType);
							console.log(`Uploaded image to S3: ${imageUrl}`);
						} catch (e) {
							console.error("Failed to upload image to S3:", e);
						}
					}

					// Update metadata in database
					const metadataUpdate: {
						name: string;
						description: string;
						image?: string;
					} = {
						name,
						description,
					};

					// Only update image if a new one was uploaded
					if (imageUrl) {
						metadataUpdate.image = imageUrl;
					}

					await db.upsertTokenMetadata(org.id, tokenId, metadataUpdate);
					console.log(`Updated metadata for org ${org.slug} token ${tokenId}`);

					// Update on-chain URIs to ensure they point to our metadata endpoint
					if (tipTokenAddress) {
						const baseUri = `${env.PUBLIC_URL}/metadata/${org.slug}/`;
						const contractUri = `${env.PUBLIC_URL}/metadata/${org.slug}/contract`;

						try {
							const baseUriTx = await setBaseURIViaSyndicate(tipTokenAddress, baseUri);
							console.log(`Updated baseURI on-chain: ${baseUriTx}`);

							const contractUriTx = await setContractURIViaSyndicate(tipTokenAddress, contractUri);
							console.log(`Updated contractURI on-chain: ${contractUriTx}`);
						} catch (e) {
							console.error("Failed to update on-chain URIs:", e);
						}
					}

					// Refresh app home
					await publishAppHome(org, payload.user.id);
				})();

				return c.json({ response_action: "clear" });
			}
		}

		// Handle metadata edit button click
		if (payload.type === "block_actions" && payload.actions) {
			const action = payload.actions[0];

			if (action.action_id === "edit_metadata") {
				// Only allow admin to edit metadata
				if (org.adminUserId !== payload.user.id) {
					return c.json({ ok: true });
				}

				// Get current metadata
				const config = org.actionConfig as { tokenId?: number } | null;
				const tokenId = config?.tokenId ?? 0;
				const [currentMetadata] = await db.getTokenMetadata(org.id, tokenId);

				// Open metadata edit modal
				await fetch("https://slack.com/api/views.open", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${org.slackBotToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						trigger_id: payload.trigger_id,
						view: getMetadataEditView(tokenId, currentMetadata || undefined),
					}),
				});
			}
		}

		return c.json({ ok: true });
	});

export default app;
