import { getAllowance, getUserExists, mint } from "../chain";
import { DAILY_ALLOWANCE } from "../constants";
import { selfLovePoem, stealingPoem } from "../openai";
import { toStar } from "../utils";
import { registerAction } from "./registry";
import type { TipAction, TipParams, TipResult, ValidationResult } from "./types";

export class MintERC1155Action implements TipAction {
	readonly type = "mint_erc1155";

	async validate({ fromUserId, toUserId, amount }: TipParams): Promise<ValidationResult> {
		// Check if recipient exists
		if (!(await getUserExists(toUserId))) {
			return {
				valid: false,
				error: `<@${toUserId}> is not registered. They need to run '/register <address>' first.`,
			};
		}

		// Check for negative amount (stealing)
		if (amount < 0) {
			const poem = await stealingPoem();
			return { valid: false, error: poem || "Nice try, but you can't steal tips!" };
		}

		// Check for zero amount
		if (amount === 0) {
			return { valid: false, error: "You can't tip 0, sorry!" };
		}

		// Check allowance
		const allowance = await getAllowance(fromUserId);
		if (allowance < BigInt(amount)) {
			return {
				valid: false,
				error: `Insufficient allowance, you only have ${allowance.toString()} more tips left to give today. Every day at 9am CT your allowance will increase by ${toStar(DAILY_ALLOWANCE)}.`,
			};
		}

		return { valid: true };
	}

	async execute({ fromUserId, toUserId, amount, message }: TipParams): Promise<TipResult> {
		const hash = await mint({
			from: fromUserId,
			to: toUserId,
			amount,
			data: message,
		});

		console.log(`minted ${amount} to ${toUserId} from ${fromUserId} with hash ${hash}`);

		const blocks = [
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `+${amount.toString()} ${message ? `(${message})` : ""}\n<@${fromUserId}> ->-> <@${toUserId}>`,
				},
			},
		];

		// Self-tip easter egg
		if (fromUserId === toUserId) {
			const selfHelp = await selfLovePoem();
			console.log(`user ${fromUserId} tipped themselves, with poem ${selfHelp}`);
			if (selfHelp) {
				blocks.push({
					type: "section",
					text: {
						type: "mrkdwn",
						text: selfHelp,
					},
				});
			}
		}

		return {
			success: true,
			txHash: hash,
			response: {
				type: "in_channel",
				blocks,
			},
		};
	}
}

// Register the action
registerAction(new MintERC1155Action());
