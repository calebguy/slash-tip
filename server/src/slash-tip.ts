import { SyndicateClient } from "@syndicateio/syndicate-node"
import { Hex } from "viem"
import { SLASH_TIP_ADDRESS, USER_REGISTRY_ADDRESS } from "./constants"
import { env } from "./env"
import { slashTipContract, userRegistryContract } from "./viem"

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
})

const chainId = 8453
const projectId = "570119ce-a49c-4245-8851-11c9d1ad74c7"
const tokenId = 0

const userIds = ["U05LE52HUJW", "U04SXK2ADK3", "U06LPBU6A02"]

interface UserWithBalance {
	nickname: string
	allowance: bigint
	id: string
	account: Hex
}

export function mint({
	from,
	to,
	amount,
}: { from: string; to: string; amount: number }) {
	return slashTipContract.write.tip([from, to, BigInt(0), BigInt(amount)])
}

export function registerUser({
	id,
	nickname,
	address,
}: { id: string; nickname: string; address: Hex }) {
	return userRegistryContract.write.addUser([
		id,
		{ nickname, account: address, allowance: BigInt(5) },
	])
}

export function getBalance(userId: string): Promise<bigint> {
	return slashTipContract.read.balanceOf([userId, BigInt(tokenId)])
}

export function getAllowance(userId: string) {
	return slashTipContract.read.allowanceOf([userId])
}

export function getUserAddress(userId: string) {
	return userRegistryContract.read.getUserAddress([userId])
}

export function getUser(userId: string) {
	return userRegistryContract.read.getUser([userId]).then((user) => ({
		...user,
		id: userId,
	}))
}

export async function getLeaderBoard() {
	const userResults = await Promise.allSettled(userIds.map((id) => getUser(id)))
	const users = userResults.filter(
		(result) => result.status === "fulfilled",
	) as PromiseFulfilledResult<UserWithBalance>[]
	const balances = await Promise.all(
		users.map((result) => getBalance(result.value.id)),
	)
	return users.map((user, index) => ({
		...user.value,
		balance: balances[index],
	}))
}

export function syndicateMint({
	from,
	to,
	amount,
}: { from: string; to: string; amount: number }) {
	return syndicate.transact.sendTransaction({
		chainId,
		projectId,
		contractAddress: SLASH_TIP_ADDRESS,
		functionSignature:
			"tip(string from, string to, uint256 tokenId, uint256 amount)",
		args: {
			tokenId: 0,
			from,
			to,
			amount,
		},
	})
}

export function syndicateRegisterUser({
	id,
	nickname,
	address,
}: { id: string; nickname: string; address: string }) {
	return syndicate.transact.sendTransaction({
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
				allowance: 5,
			},
		},
	})
}
