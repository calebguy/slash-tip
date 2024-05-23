export function abbreviate(input: string) {
	if (input.length <= 10) {
		return input
	}
	return [input.slice(0, 6), input.slice(-4)]
}
