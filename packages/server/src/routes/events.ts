import { Hono } from "hono";
import {
	deployERC1155,
	deployERC20,
	deployERC20Vault,
	getOrgAddresses,
} from "../deploy/factory";
import { db } from "../server";
import {
	publishAppHome,
	openTokenTypeModal,
	getERC1155ConfigView,
	getERC20ConfigView,
	getERC20VaultConfigView,
} from "../slack/appHome";

/**
 * Helper to fetch org addresses with retries (for propagation delay)
 */
async function fetchOrgAddressesWithRetry(orgId: string, maxAttempts = 5, delayMs = 2000) {
	for (let i = 0; i < maxAttempts; i++) {
		const addresses = await getOrgAddresses(orgId);
		if (addresses) {
			return addresses;
		}
		console.log(`Attempt ${i + 1}/${maxAttempts}: Org not found in factory yet, waiting...`);
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
}

interface SlackEventPayload {
	type: string;
	token?: string;
	challenge?: string;
	team_id?: string;
	event?: SlackEvent;
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
			values: Record<string, Record<string, { value?: string; selected_option?: { value: string } }>>;
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

			if (event.type === "app_home_opened" && event.tab === "home" && teamId) {
				console.log(`App home opened by ${event.user} in team ${teamId}`);

				// Get org by team ID
				const [org] = await db.getOrgBySlackTeamId(teamId);
				if (org?.slackBotToken) {
					await publishAppHome(org, event.user);
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
				const baseUri = values.base_uri?.base_uri_input?.value || "";
				const contractUri = values.contract_uri?.contract_uri_input?.value || "";
				const tokenId = values.token_id?.token_id_input?.value || "0";
				const dailyAllowance = values.daily_allowance?.daily_allowance_input?.value || "3";

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

					// Fetch deployed addresses from factory
					let addresses = null;
					if (deployResult.success) {
						addresses = await fetchOrgAddressesWithRetry(org.id);
						if (!addresses) {
							console.error("Failed to fetch deployed addresses for org:", org.id);
						}
					}

					// Update org config with addresses
					const [updatedOrg] = await db.updateOrg(org.id, {
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

					// Fetch deployed addresses from factory
					let addresses = null;
					if (deployResult.success) {
						addresses = await fetchOrgAddressesWithRetry(org.id);
						if (!addresses) {
							console.error("Failed to fetch deployed addresses for org:", org.id);
						}
					}

					// Update org config with addresses
					const [updatedOrg] = await db.updateOrg(org.id, {
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
				const dailyAllowance = values.daily_allowance?.daily_allowance_input?.value || "3";

				console.log("Deploying ERC20 Vault setup:", { tokenAddress, dailyAllowance });

				// Process deployment asynchronously to avoid Slack 3s timeout
				(async () => {
					const deployResult = await deployERC20Vault({
						orgId: org.id,
						tokenAddress,
					});

					if (!deployResult.success) {
						console.error("ERC20 Vault deployment failed:", deployResult.error);
					}

					// Fetch deployed addresses from factory
					let addresses = null;
					if (deployResult.success) {
						addresses = await fetchOrgAddressesWithRetry(org.id);
						if (!addresses) {
							console.error("Failed to fetch deployed addresses for org:", org.id);
						}
					}

					// Update org config with addresses
					const [updatedOrg] = await db.updateOrg(org.id, {
						actionType: "erc20_vault",
						actionConfig: {
							tokenAddress,
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
		}

		return c.json({ ok: true });
	});

export default app;
