import type { Organization } from "db";
import OpenAI from "openai/index.mjs";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions.mjs";
import type { Hex } from "viem";
import { getAllowance, getUserExists, type OrgActionConfig } from "./chain";
import { db } from "./server";

const openai = new OpenAI();

const SYSTEM_PROMPT = `You are a helpful assistant for /tip, a Slack app that lets teams send onchain tokens to each other as tips.

## About /tip
/tip allows Slack workspaces to recognize and reward teammates by sending blockchain-based tokens. Tips are sent on the Base network (an Ethereum Layer 2).

## Available Commands
Users can use these slash commands:
- \`/tip @user <amount> [message]\` - Send a tip to a teammate. Example: \`/tip @alice 1 Great work on the presentation!\`
- \`/register <address>\` - Register your wallet address to receive tips. Accepts 0x addresses or ENS names. Example: \`/register 0x1234...abcd\` or \`/register alice.eth\`
- \`/balance\` - View all registered users in the workspace
- \`/info\` - See your registered wallet address and remaining daily tip allowance
- \`/activity\` - View recent tip activity in the workspace

## How It Works
1. **Setup**: A workspace admin configures /tip in the App Home tab, choosing a token type
2. **Register**: Each user registers their wallet address using \`/register\`
3. **Tip**: Users send tips to registered teammates using \`/tip\`
4. **Daily Allowance**: Each user has a daily limit on how many tips they can send (resets daily)

## Token Types
Workspaces can be configured with different token types:
- **ERC1155 (NFTs)**: Each tip mints an NFT to the recipient
- **ERC20 (Fungible)**: Tips are sent as fungible tokens
- **ERC20 Vault**: Tips come from a pre-funded vault of existing tokens

## Common Questions & Troubleshooting

**"How do I get started?"**
First, register your wallet with \`/register <your-wallet-address>\`. If you don't have a wallet, you can create one on Base using apps like Coinbase Wallet or Rainbow.

**"What is an ENS name?"**
ENS (Ethereum Name Service) lets you use a readable name like "alice.eth" instead of a long address. You can register one at ens.domains.

**"Why can't I send a tip?"**
Common reasons:
- You haven't registered yet (use \`/register\`)
- The recipient hasn't registered
- You've used all your daily tips (check with \`/info\`)
- The workspace isn't configured yet (ask an admin)

**"Where do I see my tips?"**
Tips appear on the workspace's dashboard at [workspace].slack.tips. You can also see them in your wallet on Base.

**"What is Base?"**
Base is a secure, low-cost Ethereum Layer 2 network built by Coinbase. All /tip transactions happen on Base.

## Guidelines
- Be concise and helpful
- If you don't know something specific about this workspace's configuration, suggest the user check with an admin or use the appropriate command
- For technical blockchain questions, keep explanations simple
- You can use the available functions to look up user-specific information when relevant`;

// Tools for function calling
const tools: ChatCompletionTool[] = [
	{
		type: "function",
		function: {
			name: "get_user_info",
			description: "Get information about the current user, including whether they are registered and their remaining tip allowance",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_recent_tips",
			description: "Get recent tip activity for the workspace",
			parameters: {
				type: "object",
				properties: {
					limit: {
						type: "number",
						description: "Number of tips to return (default 5, max 10)",
					},
				},
				required: [],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_workspace_info",
			description: "Get information about the workspace's /tip configuration",
			parameters: {
				type: "object",
				properties: {},
				required: [],
			},
		},
	},
];

interface ChatContext {
	org: Organization;
	userId: string;
}

// Execute function calls
async function executeFunction(
	name: string,
	args: Record<string, unknown>,
	context: ChatContext,
): Promise<string> {
	const { org, userId } = context;
	const config = org.actionConfig as OrgActionConfig | null;

	switch (name) {
		case "get_user_info": {
			if (!config?.userRegistryAddress || !config?.slashTipAddress) {
				return JSON.stringify({ error: "Workspace not configured yet" });
			}

			const isRegistered = await getUserExists(
				config.userRegistryAddress as Hex,
				userId,
			).catch(() => false);

			if (!isRegistered) {
				return JSON.stringify({
					registered: false,
					message: "User has not registered yet",
				});
			}

			const allowance = await getAllowance(
				config.slashTipAddress as Hex,
				userId,
			).catch(() => BigInt(0));

			return JSON.stringify({
				registered: true,
				remainingAllowance: allowance.toString(),
				dailyAllowance: org.dailyAllowance,
			});
		}

		case "get_recent_tips": {
			const limit = Math.min(Number(args.limit) || 5, 10);
			const tips = await db.getTipsByOrg(org.id, limit);

			return JSON.stringify(
				tips.map((tip) => ({
					from: tip.fromUser?.nickname || "Unknown",
					to: tip.toUser?.nickname || "Unknown",
					amount: tip.amount.toString(),
					message: tip.message || null,
				})),
			);
		}

		case "get_workspace_info": {
			const tokenType = org.actionType || "not configured";
			const configured = !!org.actionType;

			let tokenInfo: Record<string, unknown> = {};
			if (config) {
				if (org.actionType === "erc1155_mint") {
					tokenInfo = { tokenId: config.tokenId };
				} else if (org.actionType === "erc20_mint") {
					tokenInfo = {
						tokenName: config.tokenName,
						tokenSymbol: config.tokenSymbol,
					};
				} else if (org.actionType === "erc20_vault") {
					tokenInfo = { tokenAddress: config.tokenAddress };
				}
			}

			return JSON.stringify({
				configured,
				tokenType,
				dailyAllowance: org.dailyAllowance,
				dashboardUrl: `https://${org.slug}.slack.tips`,
				...tokenInfo,
			});
		}

		default:
			return JSON.stringify({ error: "Unknown function" });
	}
}

export async function handleChatMessage(
	message: string,
	context: ChatContext,
): Promise<string> {
	const messages: ChatCompletionMessageParam[] = [
		{ role: "system", content: SYSTEM_PROMPT },
		{ role: "user", content: message },
	];

	// First call - may include tool calls
	const response = await openai.chat.completions.create({
		model: "gpt-4o",
		messages,
		tools,
		tool_choice: "auto",
	});

	let assistantMessage = response.choices[0].message;

	// Handle tool calls if any
	if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
		// Add assistant message with tool calls
		messages.push(assistantMessage);

		// Execute each tool call and add results
		for (const toolCall of assistantMessage.tool_calls) {
			const args = JSON.parse(toolCall.function.arguments || "{}");
			const result = await executeFunction(
				toolCall.function.name,
				args,
				context,
			);

			messages.push({
				role: "tool",
				tool_call_id: toolCall.id,
				content: result,
			});
		}

		// Get final response with tool results
		const finalResponse = await openai.chat.completions.create({
			model: "gpt-4o",
			messages,
		});

		assistantMessage = finalResponse.choices[0].message;
	}

	return assistantMessage.content || "I'm sorry, I couldn't generate a response.";
}
