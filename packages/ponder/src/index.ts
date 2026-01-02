import { ponder } from "ponder:registry";
import { db, publicClient } from "./shared";

// Handle new org deployments from factory - store contract address mapping
ponder.on("SlashTipFactory:OrgDeployed", async ({ event }) => {
	const { orgId, slashTip, userRegistry, tipAction, tipToken } = event.args;

	console.log(`OrgDeployed: ${orgId}`, {
		slashTip,
		userRegistry,
		tipAction,
		tipToken,
	});

	// Store mapping of contract addresses to org
	await db.upsertOrgContracts({
		orgId,
		slashTipAddress: slashTip,
		userRegistryAddress: userRegistry,
		tipActionAddress: tipAction,
		tipTokenAddress: tipToken || null,
		deployedAt: new Date(Number(event.block.timestamp) * 1000),
	});
});

// Handle tips from any SlashTip instance
ponder.on("SlashTip:Tipped", async ({ event }) => {
	const contractAddress = event.log.address;
	const { fromId, toId, amount, data } = event.args;

	// Look up which org this SlashTip belongs to
	const [orgContract] = await db.getOrgContractBySlashTip(contractAddress);
	if (!orgContract) {
		console.warn(`No org found for SlashTip contract ${contractAddress}`);
		return;
	}

	console.log(`Tipped: ${fromId} -> ${toId} (${amount})`, {
		orgId: orgContract.orgId,
		txHash: event.transaction.hash,
	});

	await db.upsertTip({
		orgId: orgContract.orgId,
		txHash: event.transaction.hash,
		fromUserId: fromId,
		toUserId: toId,
		amount,
		message: data || null,
		blockNumber: event.block.number,
		blockCreatedAt: new Date(Number(event.block.timestamp) * 1000),
		tokenId: 0n, // Not used, kept for schema compatibility
	});
});

// Handle user registration from any UserRegistry instance
ponder.on("UserRegistry:UserAdded", async ({ event }) => {
	const contractAddress = event.log.address;
	const { id, nickname, account } = event.args;

	// Look up which org this UserRegistry belongs to
	const [orgContract] = await db.getOrgContractByUserRegistry(contractAddress);
	if (!orgContract) {
		console.warn(`No org found for UserRegistry contract ${contractAddress}`);
		return;
	}

	console.log(`UserAdded: ${id} (${nickname})`, {
		orgId: orgContract.orgId,
		account,
	});

	await db.upsertUser({
		id,
		orgId: orgContract.orgId,
		nickname,
		address: account,
	});
});

// Handle user removal from any UserRegistry instance
ponder.on("UserRegistry:UserRemoved", async ({ event }) => {
	const { id } = event.args;

	console.log(`UserRemoved: ${id}`);

	await db.removeUser(id);
});

// Handle tip action updates from any SlashTip instance
ponder.on("SlashTip:TipActionUpdated", async ({ event }) => {
	const slashTipAddress = event.log.address;
	const { oldAction, newAction } = event.args;

	console.log(`TipActionUpdated: ${oldAction} -> ${newAction}`, {
		slashTipAddress,
	});

	// Update the org's tip action address
	const result = await db.updateOrgTipAction(slashTipAddress, newAction);
	if (result.length === 0) {
		console.warn(`No org found for SlashTip contract ${slashTipAddress}`);
	}
});
