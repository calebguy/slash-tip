import type { Organization } from "db";
import { baseClient } from "../viem";
import { erc20Abi, formatUnits, type Hex } from "viem";

const SLACK_API = "https://slack.com/api";

interface SlackApiResponse {
	ok: boolean;
	error?: string;
}

async function slackApi<T extends SlackApiResponse>(
	method: string,
	token: string,
	body: object,
): Promise<T> {
	const response = await fetch(`${SLACK_API}/${method}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const data = (await response.json()) as T;

	if (!data.ok) {
		console.error(`Slack API error (${method}):`, data.error);
	}

	return data;
}

/**
 * Fetch ERC20 token details (name, symbol, decimals) and vault balance
 */
async function getVaultTokenInfo(
	tokenAddress: Hex,
	vaultAddress: Hex,
): Promise<{
	name: string;
	symbol: string;
	decimals: number;
	balance: string;
	rawBalance: bigint;
}> {
	try {
		const [name, symbol, decimals, rawBalance] = await Promise.all([
			baseClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "name",
			}),
			baseClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "symbol",
			}),
			baseClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "decimals",
			}),
			baseClient.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [vaultAddress],
			}),
		]);

		return {
			name,
			symbol,
			decimals,
			balance: formatUnits(rawBalance, decimals),
			rawBalance,
		};
	} catch (error) {
		console.error("Failed to fetch token info:", error);
		return {
			name: "Unknown",
			symbol: "???",
			decimals: 18,
			balance: "0",
			rawBalance: 0n,
		};
	}
}

/**
 * Publish the App Home view for a user
 */
export async function publishAppHome(
	org: Organization,
	userId: string,
): Promise<void> {
	const isConfigured = org.actionType !== null;
	const view = isConfigured
		? await getConfiguredHomeView(org)
		: getUnconfiguredHomeView(org);

	await slackApi("views.publish", org.slackBotToken, {
		user_id: userId,
		view,
	});
}

/**
 * App Home view for unconfigured orgs
 */
function getUnconfiguredHomeView(org: Organization) {
	return {
		type: "home",
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "Welcome to /tip!",
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "Send onchain tips to your teammates with a simple `/tip @user` command.",
				},
			},
			{
				type: "divider",
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "*Let's set up tipping for your workspace.*\n\nChoose what type of token you want to use for tips:",
				},
			},
			{
				type: "actions",
				elements: [
					{
						type: "button",
						text: {
							type: "plain_text",
							text: "Get Started",
						},
						style: "primary",
						action_id: "setup_start",
					},
				],
			},
		],
	};
}

/**
 * App Home view for configured orgs
 */
async function getConfiguredHomeView(org: Organization) {
	const config = org.actionConfig as Record<string, unknown>;

	let configDetails = "";
	let contractSection: object[] = [];

	if (org.actionType === "erc1155_mint") {
		const tipTokenAddress = config.tipTokenAddress as Hex | undefined;
		configDetails = `*Type:* ERC1155 (NFT-style tips)\n*Token ID:* ${config.tokenId || 0}`;

		if (tipTokenAddress) {
			contractSection = [
				{
					type: "divider",
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*Contract Details*\n*Token Address:* \`${tipTokenAddress}\``,
					},
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: `<https://basescan.org/address/${tipTokenAddress}|View on BaseScan> | Tips are minted as NFTs when sent.`,
						},
					],
				},
			];
		}
	} else if (org.actionType === "erc20_mint") {
		const tipTokenAddress = config.tipTokenAddress as Hex | undefined;
		configDetails = `*Type:* ERC20\n*Token:* ${config.tokenName || ""} (${config.tokenSymbol || ""})`;

		if (tipTokenAddress) {
			contractSection = [
				{
					type: "divider",
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*Contract Details*\n*Token Address:* \`${tipTokenAddress}\``,
					},
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: `<https://basescan.org/address/${tipTokenAddress}|View on BaseScan> | Tokens are minted when tips are sent.`,
						},
					],
				},
			];
		}
	} else if (org.actionType === "erc20_vault") {
		const tokenAddress = config.tokenAddress as Hex | undefined;
		const vaultAddress = config.tipActionAddress as Hex | undefined;

		if (tokenAddress && vaultAddress) {
			const tokenInfo = await getVaultTokenInfo(tokenAddress, vaultAddress);
			configDetails = `*Type:* ERC20 Vault\n*Token:* ${tokenInfo.name} (${tokenInfo.symbol})`;

			contractSection = [
				{
					type: "divider",
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `*Vault Details*\n*Vault Address:* \`${vaultAddress}\`\n*Balance:* ${tokenInfo.balance} ${tokenInfo.symbol}`,
					},
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: `<https://basescan.org/address/${vaultAddress}|View on BaseScan> | To deposit, transfer ${tokenInfo.symbol} to the vault address on Base.`,
						},
					],
				},
			];
		} else {
			configDetails = `*Type:* ERC20 Vault\n*Token:* ${tokenAddress || "Not configured"}`;
		}
	}

	return {
		type: "home",
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "/tip",
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "Your workspace is configured and ready to tip!",
				},
			},
			{
				type: "divider",
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Configuration*\n${configDetails}\n*Daily Allowance:* ${org.dailyAllowance} tips per user`,
				},
			},
			...contractSection,
			{
				type: "divider",
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "*Quick Commands*\n• `/tip @user [amount] [message]` - Send a tip\n• `/register 0x...` - Register your wallet\n• `/balance` - View leaderboard\n• `/info` - View your info",
				},
			},
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: `<https://slack.tips/${org.slug}|View leaderboard on slack.tips>`,
					},
				],
			},
		],
	};
}

/**
 * Open the token type selection modal
 */
export async function openTokenTypeModal(
	org: Organization,
	triggerId: string,
): Promise<void> {
	const view = {
		type: "modal",
		callback_id: "token_type_select",
		title: {
			type: "plain_text",
			text: "Choose Token Type",
		},
		submit: {
			type: "plain_text",
			text: "Next",
		},
		close: {
			type: "plain_text",
			text: "Cancel",
		},
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "What type of token do you want to use for tips?",
				},
			},
			{
				type: "input",
				block_id: "token_type",
				element: {
					type: "static_select",
					action_id: "token_type_select",
					placeholder: {
						type: "plain_text",
						text: "Select token type",
					},
					options: [
						{
							text: {
								type: "plain_text",
								text: "New ERC1155 (NFT-style)",
							},
							value: "erc1155",
						},
						{
							text: {
								type: "plain_text",
								text: "New ERC20 (Fungible token)",
							},
							value: "erc20",
						},
						{
							text: {
								type: "plain_text",
								text: "Existing ERC20 (Use your own token)",
							},
							value: "erc20_vault",
						},
					],
				},
				label: {
					type: "plain_text",
					text: "Token Type",
				},
			},
		],
	};

	await slackApi("views.open", org.slackBotToken, {
		trigger_id: triggerId,
		view,
	});
}

/**
 * Get the ERC1155 configuration modal view
 */
export function getERC1155ConfigView() {
	return {
		type: "modal",
		callback_id: "erc1155_config",
		title: {
			type: "plain_text",
			text: "ERC1155 Setup",
		},
		submit: {
			type: "plain_text",
			text: "Deploy",
		},
		close: {
			type: "plain_text",
			text: "Cancel",
		},
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "Configure your ERC1155 tip token. We'll deploy the contracts for you.",
				},
			},
			{
				type: "input",
				block_id: "base_uri",
				optional: true,
				element: {
					type: "plain_text_input",
					action_id: "base_uri_input",
					placeholder: {
						type: "plain_text",
						text: "https://example.com/metadata/",
					},
				},
				label: {
					type: "plain_text",
					text: "Base URI (for token metadata)",
				},
			},
			{
				type: "input",
				block_id: "contract_uri",
				optional: true,
				element: {
					type: "plain_text_input",
					action_id: "contract_uri_input",
					placeholder: {
						type: "plain_text",
						text: "https://example.com/collection.json",
					},
				},
				label: {
					type: "plain_text",
					text: "Contract URI (collection metadata)",
				},
			},
			{
				type: "input",
				block_id: "token_id",
				element: {
					type: "plain_text_input",
					action_id: "token_id_input",
					initial_value: "0",
					placeholder: {
						type: "plain_text",
						text: "0",
					},
				},
				label: {
					type: "plain_text",
					text: "Token ID",
				},
			},
			{
				type: "input",
				block_id: "daily_allowance",
				element: {
					type: "plain_text_input",
					action_id: "daily_allowance_input",
					initial_value: "3",
					placeholder: {
						type: "plain_text",
						text: "3",
					},
				},
				label: {
					type: "plain_text",
					text: "Daily Allowance (tips per user per day)",
				},
			},
		],
	};
}

/**
 * Get the ERC20 configuration modal view
 */
export function getERC20ConfigView() {
	return {
		type: "modal",
		callback_id: "erc20_config",
		title: {
			type: "plain_text",
			text: "ERC20 Setup",
		},
		submit: {
			type: "plain_text",
			text: "Deploy",
		},
		close: {
			type: "plain_text",
			text: "Cancel",
		},
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "Configure your ERC20 tip token. We'll deploy the contracts for you.",
				},
			},
			{
				type: "input",
				block_id: "token_name",
				element: {
					type: "plain_text_input",
					action_id: "token_name_input",
					placeholder: {
						type: "plain_text",
						text: "Acme Tips",
					},
				},
				label: {
					type: "plain_text",
					text: "Token Name",
				},
			},
			{
				type: "input",
				block_id: "token_symbol",
				element: {
					type: "plain_text_input",
					action_id: "token_symbol_input",
					placeholder: {
						type: "plain_text",
						text: "ACME",
					},
				},
				label: {
					type: "plain_text",
					text: "Token Symbol",
				},
			},
			{
				type: "input",
				block_id: "decimals",
				element: {
					type: "plain_text_input",
					action_id: "decimals_input",
					initial_value: "18",
					placeholder: {
						type: "plain_text",
						text: "18",
					},
				},
				label: {
					type: "plain_text",
					text: "Decimals",
				},
			},
			{
				type: "input",
				block_id: "daily_allowance",
				element: {
					type: "plain_text_input",
					action_id: "daily_allowance_input",
					initial_value: "3",
					placeholder: {
						type: "plain_text",
						text: "3",
					},
				},
				label: {
					type: "plain_text",
					text: "Daily Allowance (tips per user per day)",
				},
			},
		],
	};
}

/**
 * Get the ERC20 Vault configuration modal view
 */
export function getERC20VaultConfigView() {
	return {
		type: "modal",
		callback_id: "erc20_vault_config",
		title: {
			type: "plain_text",
			text: "ERC20 Vault Setup",
		},
		submit: {
			type: "plain_text",
			text: "Deploy",
		},
		close: {
			type: "plain_text",
			text: "Cancel",
		},
		blocks: [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: "Use an existing ERC20 token for tips. You'll need to deposit tokens into the vault after setup.",
				},
			},
			{
				type: "input",
				block_id: "token_address",
				element: {
					type: "plain_text_input",
					action_id: "token_address_input",
					placeholder: {
						type: "plain_text",
						text: "0x...",
					},
				},
				label: {
					type: "plain_text",
					text: "Token Contract Address",
				},
			},
			{
				type: "input",
				block_id: "daily_allowance",
				element: {
					type: "plain_text_input",
					action_id: "daily_allowance_input",
					initial_value: "3",
					placeholder: {
						type: "plain_text",
						text: "3",
					},
				},
				label: {
					type: "plain_text",
					text: "Daily Allowance (tips per user per day)",
				},
			},
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: "After setup, you'll need to deposit tokens into the vault contract.",
					},
				],
			},
		],
	};
}
