import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";

import { SLASH_TIP_ADDRESS, USER_REGISTRY_ADDRESS } from "utils/src/constants";
import type { Hex } from "viem";
import { DAILY_ALLOWANCE } from "./constants";
import { env } from "./env";
import { slashTipContract, userRegistryContract } from "./viem";

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
});

const chainId = 8453;
const projectId = "570119ce-a49c-4245-8851-11c9d1ad74c7";
const tokenId = 0;

export function getBalance(userId: string): Promise<bigint> {
	return slashTipContract.read.balanceOf([userId, BigInt(tokenId)]);
}

export function getAllowance(userId: string) {
	return slashTipContract.read.allowanceOf([userId]);
}

export function getUserAddress(userId: string) {
	return userRegistryContract.read.getUserAddress([userId]);
}

export function getUser(userId: string) {
	return userRegistryContract.read.getUser([userId]).then((user) => ({
		...user,
		id: userId,
	}));
}

export async function getLeaderBoard() {
	return slashTipContract.read.leaderboard([BigInt(tokenId)]);
}

export async function getUserExists(userId: string) {
	try {
		const user = await userRegistryContract.read.getUser([userId]);
		return user.id === userId;
	} catch (e) {
		return false;
	}
}

export function addAllowanceForAllUsers(amount: number) {
	return slashTipContract.write.addAllowanceForAllUsers([BigInt(amount)]);
}

export async function mint({
	from,
	to,
	amount,
	data,
}: { from: string; to: string; amount: number; data: Hex }) {
	console.log("args", { tokenId, from, to, amount, data });
	const { transactionId } = await syndicate.transact.sendTransaction({
		chainId,
		projectId,
		contractAddress: SLASH_TIP_ADDRESS,
		functionSignature:
			"tip(string from, string to, uint256 tokenId, uint256 amount, bytes data)",
		args: {
			tokenId,
			from,
			to,
			amount,
			data,
		},
	});
	try {
		return await waitForHash(syndicate, {
			projectId,
			transactionId,
			every: 200,
			maxAttempts: 10,
		});
	} catch (e) {
		console.error(
			`[mint] could not get transaction hash for ${transactionId} in reasonable amount of time`,
		);
		return null;
	}
}

export async function registerSyn({
	id,
	nickname,
	address,
}: { id: string; nickname: string; address: string }) {
	console.log("sending syn transaction");
	console.log({
		id,
		nickname,
		address,
		projectId,
		chainId,
		USER_REGISTRY_ADDRESS,
		DAILY_ALLOWANCE,
	});
	const { transactionId } = await syndicate.transact.sendTransaction({
		chainId,
		projectId,
		contractAddress: USER_REGISTRY_ADDRESS,
		functionSignature:
			"addUser(string id, (string nickname, address account, uint256 allowance) user)",
		args: {
			id,
			user: {
				nickname,
				account: address,
				allowance: DAILY_ALLOWANCE,
			},
		},
	});
	try {
		return await waitForHash(syndicate, {
			projectId,
			transactionId,
			every: 200,
			maxAttempts: 3,
		});
	} catch (e) {
		console.error(
			`[register-user] could not get transaction hash for ${transactionId} in reasonable amount of time`,
		);
		return null;
	}
}

export function register({
	id,
	nickname,
	address,
}: { id: string; nickname: string; address: Hex }) {
	return userRegistryContract.write.addUser([
		id,
		{
			id,
			nickname,
			account: address,
			allowance: BigInt(DAILY_ALLOWANCE),
		},
	]);
}
