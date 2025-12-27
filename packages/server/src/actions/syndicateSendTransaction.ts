import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";
import { env } from "../env";
import { registerAction } from "./registry";
import type { TipAction, TipParams, TipResult, ValidationResult } from "./types";

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
});

// Default to Base mainnet - could be configurable per org
const DEFAULT_CHAIN_ID = 8453;
const DEFAULT_PROJECT_ID = "570119ce-a49c-4245-8851-11c9d1ad74c7";

export interface SyndicateSendTransactionConfig {
	type: "syndicate_send_transaction";
	contractAddress: string;
	functionSignature: string;
	// Args with placeholders: {{fromUserId}}, {{toUserId}}, {{amount}}, {{message}}, {{recipientAddress}}
	args: Record<string, unknown>;
	// Optional overrides
	chainId?: number;
	projectId?: string;
	// Display settings
	successMessage?: string;
}

/**
 * Replace template placeholders in args with actual values
 * Supports: {{fromUserId}}, {{toUserId}}, {{amount}}, {{message}}, {{recipientAddress}}
 */
function interpolateArgs(
	args: Record<string, unknown>,
	params: TipParams,
	recipientAddress?: string,
): Record<string, unknown> {
	const replacements: Record<string, unknown> = {
		"{{fromUserId}}": params.fromUserId,
		"{{toUserId}}": params.toUserId,
		"{{amount}}": params.amount,
		"{{message}}": params.message,
		"{{recipientAddress}}": recipientAddress || "",
	};

	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(args)) {
		if (typeof value === "string" && value in replacements) {
			result[key] = replacements[value];
		} else if (typeof value === "string" && value.includes("{{")) {
			// Handle partial replacements like "prefix_{{fromUserId}}"
			let replaced = value;
			for (const [placeholder, replacement] of Object.entries(replacements)) {
				replaced = replaced.replace(placeholder, String(replacement));
			}
			result[key] = replaced;
		} else {
			result[key] = value;
		}
	}

	return result;
}

export class SyndicateSendTransactionAction implements TipAction {
	readonly type = "syndicate_send_transaction";

	async validate({ org, amount }: TipParams): Promise<ValidationResult> {
		const config = org.actionConfig as SyndicateSendTransactionConfig | null;

		if (!config) {
			return { valid: false, error: "Action not configured for this organization" };
		}

		if (!config.contractAddress || !config.functionSignature) {
			return { valid: false, error: "Missing contract configuration" };
		}

		if (amount <= 0) {
			return { valid: false, error: "Amount must be greater than 0" };
		}

		return { valid: true };
	}

	async execute(params: TipParams): Promise<TipResult> {
		const { org, fromUserId, toUserId, amount, message } = params;
		const config = org.actionConfig as SyndicateSendTransactionConfig;

		const chainId = config.chainId || DEFAULT_CHAIN_ID;
		const projectId = config.projectId || DEFAULT_PROJECT_ID;

		// Interpolate args with actual values
		const args = interpolateArgs(config.args || {}, params);

		console.log("Sending Syndicate transaction:", {
			chainId,
			projectId,
			contractAddress: config.contractAddress,
			functionSignature: config.functionSignature,
			args,
		});

		try {
			const { transactionId } = await syndicate.transact.sendTransaction({
				chainId,
				projectId,
				contractAddress: config.contractAddress,
				functionSignature: config.functionSignature,
				args,
			});

			let hash: string | null = null;
			try {
				hash = await waitForHash(syndicate, {
					projectId,
					transactionId,
					every: 200,
					maxAttempts: 2,
				});
			} catch (e) {
				console.error(
					`[syndicate] could not get tx hash for ${transactionId} in reasonable time`,
				);
			}

			console.log(`Transaction sent: ${hash || transactionId}`);

			const successMessage =
				config.successMessage ||
				`+${amount} ${message ? `(${message})` : ""}\n<@${fromUserId}> ->-> <@${toUserId}>`;

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
								text: successMessage,
							},
						},
					],
				},
			};
		} catch (error) {
			console.error("Syndicate transaction failed:", error);
			return {
				success: false,
				response: {
					type: "ephemeral",
					text: "Transaction failed. Please try again.",
				},
			};
		}
	}
}

registerAction(new SyndicateSendTransactionAction());
