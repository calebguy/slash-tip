import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";
import { type OrgActionConfig } from "../chain";
import { env } from "../env";
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
 * This handler works for all action types (erc1155_mint, erc20_mint, erc20_vault)
 * because the SlashTip contract already knows which action contract to call.
 */
class SlashTipAction implements TipAction {
	constructor(public readonly type: string) {}

	async validate({ org, toUserId, amount }: TipParams): Promise<ValidationResult> {
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

		if (amount <= 0) {
			return { valid: false, error: "Amount must be greater than 0" };
		}

		if (!toUserId) {
			return { valid: false, error: "Recipient not specified" };
		}

		return { valid: true };
	}

	async execute(params: TipParams): Promise<TipResult> {
		const { org, fromUserId, toUserId, amount, message } = params;
		const config = org.actionConfig as OrgActionConfig;

		// Scale amount by decimals for ERC20 tokens
		// ERC1155 doesn't use decimals, ERC20 defaults to 18
		let scaledAmount: bigint;
		if (org.actionType === "erc1155_mint") {
			scaledAmount = BigInt(amount);
		} else {
			const decimals = config.decimals ?? 18;
			scaledAmount = BigInt(amount) * BigInt(10 ** decimals);
		}

		console.log("SlashTip execution:", {
			orgId: org.id,
			slashTipAddress: config.slashTipAddress,
			fromUserId,
			toUserId,
			amount,
			scaledAmount: scaledAmount.toString(),
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
					_amount: scaledAmount.toString(),
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
