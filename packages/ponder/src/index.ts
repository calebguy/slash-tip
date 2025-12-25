import { ponder } from "ponder:registry";
import { decodeFunctionData, zeroAddress } from "viem";
import { OldSlashTipAbi } from "./OldSlashTipAbi";
import { db, publicClient } from "./shared";
import { syncUserRegistry } from "./userRegistry";

syncUserRegistry().catch((e) => {
	console.error(e);
});

ponder.on("Tip:TransferSingle", async ({ event }) => {
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
			// Look up sender's org to associate tip with organization
			const [fromUser] = await db.getUserById(fromUserId as string);
			if (!fromUser) {
				console.warn(`User ${fromUserId} not found, skipping tip`);
				return;
			}

			await db.upsertTip({
				txHash: hash,
				fromUserId: fromUserId as string,
				toUserId: toUserId as string,
				tokenId,
				amount,
				blockNumber: tx.blockNumber,
				blockCreatedAt: new Date(Number(block.timestamp) * 1000),
				orgId: fromUser.orgId,
			});
		}
	} catch (e) {
		console.warn("old abi failed, trying new abi...");
		console.error(e);
	}
});

ponder.on("SlashTip:Tipped", async ({ event }) => {
	const { hash } = event.transaction;
	const { fromId, toId, tokenId, amount, data } = event.args;

	const tx = await publicClient.getTransaction({ hash });
	const block = await publicClient.getBlock({
		blockNumber: tx.blockNumber,
	});

	// Look up sender's org to associate tip with organization
	const [fromUser] = await db.getUserById(fromId);
	if (!fromUser) {
		console.warn(`User ${fromId} not found, skipping tip`);
		return;
	}

	await db
		.upsertTip({
			txHash: hash,
			fromUserId: fromId,
			toUserId: toId,
			tokenId,
			amount,
			blockNumber: tx.blockNumber,
			blockCreatedAt: new Date(Number(block.timestamp) * 1000),
			message: data,
			orgId: fromUser.orgId,
		})
		.catch((e) => {
			console.warn("failed to upsert tip", {
				hash,
				fromId,
				toId,
				tokenId,
				amount,
				data,
			});
		});
});
