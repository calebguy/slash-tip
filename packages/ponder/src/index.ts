import { ponder } from "ponder:registry";
import SlashTipAbi from "utils/src/abis/SlashTipAbi";
import { decodeFunctionData, zeroAddress } from "viem";
import { OldSlashTipAbi } from "./OldSlashTipAbi";
import { db, publicClient } from "./shared";
import { syncUserRegistry } from "./userRegistry";

syncUserRegistry();

ponder.on("Tip:TransferSingle", async ({ event, context }) => {
	const { hash } = event.transaction;
	const tx = await publicClient.getTransaction({ hash });
	try {
		const {
			args: [fromUserId, toUserId, tokenId, amount],
		} = decodeFunctionData({
			abi: OldSlashTipAbi,
			data: tx.input,
		});
		if (
			fromUserId !== zeroAddress &&
			toUserId !== zeroAddress &&
			tokenId !== undefined &&
			amount !== undefined
		) {
			const block = await publicClient.getBlock({
				blockNumber: tx.blockNumber,
			});
			await db.upsertTip({
				txHash: hash,
				fromUserId: fromUserId as string,
				toUserId: toUserId as string,
				tokenId,
				amount,
				blockNumber: tx.blockNumber,
				blockCreatedAt: new Date(Number(block.timestamp) * 1000),
			});
		}
	} catch (e) {
		console.warn("old abi failed, trying new abi...");
		console.error(e);

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
				const block = await publicClient.getBlock({
					blockNumber: tx.blockNumber,
				});
				await db.upsertTip({
					txHash: hash,
					fromUserId: fromUserId as string,
					toUserId: toUserId as string,
					tokenId,
					amount,
					blockNumber: tx.blockNumber,
					blockCreatedAt: new Date(Number(block.timestamp) * 1000),
				});
			}
		} catch (e) {
			console.warn("new abi failed, skipping...");
			console.error(e);
		}
	}
});
