import { type Hex, getAddress } from "viem";

export function parseTipCommandArgs(input: string) {
	console.log("input", input);

	// Match the user mention, amount, and optional message
	const pattern = /^<@([A-Z0-9]+)\|[^>]+>\s+(\d+)(?:\s+(.*))?$/;
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
