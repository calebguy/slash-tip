export function parseTipCommandArgs(input: string) {
	const idPattern = /\|([\w\d]+)>/
	const numberPattern = /(\d+)$/

	const _id = input.match(idPattern)
	const _amount = input.match(numberPattern)

	const id = _id ? _id[1] : null
	const amount = _amount ? _amount[0] : null

	return { id, amount }
}
