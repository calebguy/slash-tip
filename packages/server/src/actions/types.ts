import type { Organization } from "db";
import type { SlackSlashCommandPayload } from "../types";

export interface TipParams {
	org: Organization;
	fromUserId: string;
	toUserId: string;
	amount: number;
	message: string;
	raw: SlackSlashCommandPayload;
}

export interface SlackBlock {
	type: string;
	text?: {
		type: string;
		text: string;
	};
	[key: string]: unknown;
}

export interface TipResponse {
	type: "ephemeral" | "in_channel";
	text?: string;
	blocks?: SlackBlock[];
}

export interface TipResult {
	success: boolean;
	response: TipResponse;
	txHash?: string | null;
}

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export interface TipAction {
	readonly type: string;

	/**
	 * Validate the tip before executing.
	 * Check things like: recipient exists, allowance available, etc.
	 */
	validate(params: TipParams): Promise<ValidationResult>;

	/**
	 * Execute the tip action.
	 * Could be on-chain (mint, transfer) or off-chain (webhook, poem).
	 */
	execute(params: TipParams): Promise<TipResult>;
}

/**
 * Configuration stored in the database for each action type.
 * Each action type can have its own config shape.
 */
export type ActionConfig = SyndicateSendTransactionConfig | PoemConfig;

export interface SyndicateSendTransactionConfig {
	type: "syndicate_send_transaction";
	contractAddress: string;
	functionSignature: string;
	args: Record<string, unknown>;
	chainId?: number;
	projectId?: string;
	successMessage?: string;
}

export interface PoemConfig {
	type: "poem";
	style?: "haiku" | "limerick" | "sonnet" | "free";
}
