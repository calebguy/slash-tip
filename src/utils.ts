export function parseTipCommandArgs(input: string) {
	const namePattern = /\|([\w\d]+)>/
	const numberPattern = /(\d+)$/

	const nameMatch = input.match(namePattern)
	const numberMatch = input.match(numberPattern)

	const name = nameMatch ? nameMatch[1] : null // Extracts the name if found
	const amount = numberMatch ? numberMatch[0] : null // Extracts the number if found

	return { name, amount }
}
