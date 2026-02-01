import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";
import { formatUnits, parseUnits } from "viem";
import { type OrgActionConfig } from "../chain";
import { env } from "../env";
import { db } from "../server";
import { registerAction } from "./registry";
import type { TipAction, TipParams, TipResult, ValidationResult } from "./types";

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
});

const CHAIN_ID = 8453; // Base mainnet
const PROJECT_ID = "570119ce-a49c-4245-8851-11c9d1ad74c7";

/**
 * SlashTip Action Handler - calls SlashTip.tip() via Syndicate
 *
 * This handler works for all action types (erc1155_mint, erc20_mint, erc20_vault, eth_vault)
 * because the SlashTip contract already knows which action contract to call.
 *
 * The server handles amount scaling to base units (wei) before sending to contracts:
 * - ERC1155: Integer quantity (no scaling)
 * - ERC20: Scaled by token decimals from config
 * - ETH: Scaled by 18 decimals (wei)
 */
class SlashTipAction implements TipAction {
	constructor(public readonly type: string) {}

	async validate({ org, fromUserId, toUserId, amount }: TipParams): Promise<ValidationResult> {
		const config = org.actionConfig as OrgActionConfig | null;

		if (!config) {
			return { valid: false, error: "Action not configured for this organization" };
		}

		if (config.deploymentStatus !== "deployed") {
			return { valid: false, error: "Contracts not yet deployed. Please wait for deployment to complete." };
		}

		if (!config.slashTipAddress) {
			return { valid: false, error: "SlashTip contract address not configured" };
		}

		if (!config.userRegistryAddress) {
			return { valid: false, error: "UserRegistry contract address not configured" };
		}

		if (amount <= 0) {
			return { valid: false, error: "Amount must be greater than 0" };
		}

		if (!toUserId) {
			return { valid: false, error: "Recipient not specified" };
		}

		// Check sender's allowance from database (off-chain)
		try {
			const allowanceStr = await db.getUserAllowance(fromUserId);
			const allowance = parseFloat(allowanceStr);

			if (Number(amount) > allowance) {
				return {
					valid: false,
					error: `Insufficient allowance. You have ${allowanceStr} remaining, but tried to send ${amount}.`,
				};
			}
		} catch (error) {
			// User might not exist in database yet
			console.log(`Could not check allowance for ${fromUserId}:`, error);
		}

		return { valid: true };
	}

	async execute(params: TipParams): Promise<TipResult> {
		const { org, fromUserId, toUserId, amount, message } = params;
		const config = org.actionConfig as OrgActionConfig;

		// Determine decimals based on action type
		// - ERC1155: No scaling (NFT quantity, integer)
		// - ERC20 mint/vault: Use config.decimals (from token)
		// - ETH vault: Always 18 decimals
		let tipAmount: bigint;
		if (org.actionType === "erc1155_mint") {
			// ERC1155 amounts are integer quantities, no scaling needed
			tipAmount = BigInt(Math.floor(Number(amount)));
		} else if (org.actionType === "eth_vault") {
			// ETH always has 18 decimals
			tipAmount = parseUnits(amount.toString(), 18);
		} else {
			// ERC20 mint and vault use token decimals from config
			const decimals = config.decimals ?? 18;
			tipAmount = parseUnits(amount.toString(), decimals);
		}

		console.log("SlashTip execution:", {
			orgId: org.id,
			actionType: org.actionType,
			slashTipAddress: config.slashTipAddress,
			fromUserId,
			toUserId,
			amount,
			tipAmount: tipAmount.toString(),
			decimals: config.decimals,
			message,
		});

		try {
			const { transactionId } = await syndicate.transact.sendTransaction({
				chainId: CHAIN_ID,
				projectId: PROJECT_ID,
				contractAddress: config.slashTipAddress!,
				functionSignature: "tip(string _fromId, string _toId, uint256 _amount, string _data)",
				args: {
					_fromId: fromUserId,
					_toId: toUserId,
					_amount: tipAmount.toString(),
					_data: message || "",
				},
			});

			let hash: string | null = null;
			try {
				hash = await waitForHash(syndicate, {
					projectId: PROJECT_ID,
					transactionId,
					every: 200,
					maxAttempts: 5,
				});
			} catch (e) {
				console.log(`[syndicate] could not get tx hash for ${transactionId} in reasonable time`);
			}

			console.log(`SlashTip transaction sent: ${hash || transactionId}`);

			// Deduct allowance from database after successful tip
			try {
				await db.deductUserAllowance(fromUserId, amount.toString());
				console.log(`Deducted ${amount} from ${fromUserId}'s allowance`);
			} catch (e) {
				console.error(`Failed to deduct allowance for ${fromUserId}:`, e);
			}

			const txLink = hash ? `<https://basescan.org/tx/${hash}|view>` : "";

			return {
				success: true,
				txHash: hash,
				response: {
					type: "in_channel",
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: `<@${fromUserId}> tipped <@${toUserId}> ${amount} ${message ? `"${message}"` : ""} ${txLink}`,
							},
						},
					],
				},
			};
		} catch (error) {
			console.error("SlashTip transaction failed:", error);
			return {
				success: false,
				response: {
					type: "ephemeral",
					text: "Tip failed. Please try again.",
				},
			};
		}
	}
}

// Register the SlashTip action for all action types
registerAction(new SlashTipAction("erc1155_mint"));
registerAction(new SlashTipAction("erc20_mint"));
registerAction(new SlashTipAction("erc20_vault"));
registerAction(new SlashTipAction("eth_vault"));
