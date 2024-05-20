const slackIDPattern = /<@(\w+)\|/

export function parseUserFromText(input: string) {
	const id = input.match(slackIDPattern)
	return id ? id[1] : null
}

export function parseTipCommandArgs(input: string) {
	const numberPattern = /(\d+)$/

	const _amount = input.match(numberPattern)

	const amount = _amount ? _amount[0] : null

	return { id: parseUserFromText(input), amount }
}

export function extractEthereumAddresses(text: string) {
	// Ethereum address regex pattern
	const ethAddressPattern = /\b0x[a-fA-F0-9]{40}\b/g
	// Find all matches in the text
	const addresses = text.match(ethAddressPattern)
	return addresses || []
}
