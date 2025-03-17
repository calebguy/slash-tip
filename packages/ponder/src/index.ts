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

const publicClient = createPublicClient({
	chain: base,
	transport: http(process.env.PONDER_RPC_URL_1),
});

const db = new Db(
	process.env.DATABASE_URL!,
	process.env.DATABASE_URL!.includes("neon"),
);

ponder.on("Tip:TransferSingle", async ({ event, context }) => {
	const { hash } = event.transaction;
	// const { from, to, id, amount, operator } = event.args;
	// console.log({ hash, from, to, id, amount, operator });

	const tx = await publicClient.getTransactioxn({ hash });
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
			tokenId &&
			amount
		) {
			await db.upsertTip({
				txHash: hash,
				fromUserId: fromUserId as string,
				toUserId: toUserId as string,
				tokenId,
				amount,
			});
			console.log("one", decoded);
		}
	} catch (e) {
		console.warn("skipping...");
	}
});
