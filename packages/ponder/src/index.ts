import { ponder } from "ponder:registry";
import SlashTipAbi from "utils/src/abis/SlashTipAbi";
import TipAbi from "utils/src/abis/TipAbi";
import { createPublicClient, decodeFunctionData, http } from "viem";
import { base } from "viem/chains";

const publicClient = createPublicClient({
	chain: base,
	transport: http(process.env.PONDER_RPC_URL_1),
});

ponder.on("Tip:TransferSingle", async ({ event, context }) => {
	const { hash } = event.transaction;
	// const { from, to, id, amount, operator } = event.args;
	// console.log({ hash, from, to, id, amount, operator });

	const tx = await publicClient.getTransaction({ hash });
	try {
		const decoded = decodeFunctionData({
			abi: SlashTipAbi,
			data: tx.input,
		});
		console.log(decoded);
	} catch (e) {}

	try {
		const decoded = decodeFunctionData({
			abi: TipAbi,
			data: tx.input,
		});
		console.log(decoded);
	} catch (e) {}
});
