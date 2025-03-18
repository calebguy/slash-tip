import { Db } from "db";
import { ponder } from "ponder:registry";
import SlashTipAbi from "utils/src/abis/SlashTipAbi";
import {
	createPublicClient,
	decodeFunctionData,
	http,
	zeroAddress,
} from "viem";
import { base } from "viem/chains";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

const publicClient = createPublicClient({
	chain: base,
	transport: http(process.env.PONDER_RPC_URL_1),
});

const db = new Db(
	process.env.DATABASE_URL,
	process.env.DATABASE_URL.includes("neon"),
);

ponder.on("Tip:TransferSingle", async ({ event, context }) => {
	const { hash } = event.transaction;
	const tx = await publicClient.getTransaction({ hash });
	try {
		const {
			args: [fromUserId, toUserId, tokenId, amount],
		} = decodeFunctionData({
			abi: SlashTipAbi,
			data: tx.input,
		});
		if (
			fromUserId !== zeroAddress &&
			toUserId !== zeroAddress &&
			tokenId !== undefined &&
			amount !== undefined
		) {
			await db.upsertTip({
				txHash: hash,
				fromUserId: fromUserId as string,
				toUserId: toUserId as string,
				tokenId,
				amount,
			});
		}
	} catch (e) {
		console.warn("skipping...");
	}
});
