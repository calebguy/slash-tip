import { type Hex, getAddress } from "viem";

export function parseTipCommandArgs(input: string) {
	console.log("input", input);

	// Match the user mention, amount (integer or decimal), and optional message
	const pattern = /^<@([A-Z0-9]+)\|[^>]+>\s+(\d+(?:\.\d+)?)(?:\s+(.*))?$/;
	const match = input.match(pattern);

	if (!match) {
		return { id: null, amount: null, message: null };
	}

	const [, id, amount, message] = match;

	return { id, amount, message: message || "" };
}

export function extractEthereumAddresses(text: string) {
	// Ethereum address regex pattern
	const ethAddressPattern = /\b0x[a-fA-F0-9]{40}\b/g;
	// Find all matches in the text
	const addresses = text.match(ethAddressPattern);
	return addresses ? (addresses[0] as Hex) : null;
}

export function extractFirstWord(text: string) {
	return text.split(" ")[0];
}

export function toStar(amount: bigint | number) {
	return "✺".repeat(Number(amount));
}

export function abbreviate(input: string) {
	if (input.length <= 10) {
		return input;
	}
	return `${input.slice(0, 6)}***${input.slice(-4)}`;
}

export function isEthAddress(input: string) {
	try {
		getAddress(input);
		return true;
	} catch (e) {
		return false;
	}
}

const USER_COMMANDS = ['/tip', '/balance', '/activity', '/register', '/info'];

export function isPureCommand(text: string): boolean {
	const trimmed = text.trim();
	const lowerTrimmed = trimmed.toLowerCase();

	// Find if message starts with a known command
	const startsWithCommand = USER_COMMANDS.find(cmd =>
		lowerTrimmed.startsWith(cmd)
	);

	if (!startsWithCommand) {
		return false;
	}

	// Get text after the command
	const afterCommand = trimmed.slice(startsWithCommand.length).trim();

	// If there's a question mark, it's likely conversational
	if (afterCommand.includes('?')) {
		return false;
	}

	// Check for conversational keywords that indicate a question
	const conversationalPatterns = [
		/\bwhat\b/i, /\bhow\b/i, /\bwhy\b/i, /\bdoes\b/i,
		/\bcan\b/i, /\bwork\b/i, /\bmean\b/i, /\bhelp\b/i,
		/\bexplain\b/i, /\bshow\b/i, /\btell\b/i
	];

	for (const pattern of conversationalPatterns) {
		if (pattern.test(afterCommand)) {
			return false;
		}
	}

	// Short messages starting with a command are likely pure commands
	// (handles "/balance", "/balance please", "/tip @user 10 great job", etc.)
	return true;
}
