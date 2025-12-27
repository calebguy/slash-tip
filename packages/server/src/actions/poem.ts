import { generateTipPoem } from "../openai";
import { registerAction } from "./registry";
import type { TipAction, TipParams, TipResult, ValidationResult } from "./types";

export class PoemAction implements TipAction {
	readonly type = "poem";

	async validate(_params: TipParams): Promise<ValidationResult> {
		// Anyone can receive a poem - no validation needed
		return { valid: true };
	}

	async execute({ fromUserId, toUserId, message }: TipParams): Promise<TipResult> {
		const poem = await generateTipPoem(fromUserId, toUserId, message);

		return {
			success: true,
			response: {
				type: "in_channel",
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `<@${fromUserId}> wrote a poem for <@${toUserId}>:`,
						},
					},
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `_${poem}_`,
						},
					},
				],
			},
		};
	}
}

// Register the action
registerAction(new PoemAction());
