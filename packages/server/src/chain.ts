import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";
import type { Hex } from "viem";
import { env } from "./env";
import { getSlashTipContract, getUserRegistryContract } from "./viem";

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
});

const chainId = 8453;
const projectId = "570119ce-a49c-4245-8851-11c9d1ad74c7";

// Types for org action config (stored in organizations.actionConfig)
export interface OrgActionConfig {
	// Deployed contract addresses
	slashTipAddress?: string;
	userRegistryAddress?: string;
	tipActionAddress?: string;
	tipTokenAddress?: string;
	// Deployment info
	deploymentTxHash?: string;
	deploymentStatus?: "pending" | "deployed";
	// Type-specific config
	tokenAddress?: string; // For ERC20 Vault
	tokenName?: string; // For ERC20 Mint
	tokenSymbol?: string; // For ERC20 Mint
	decimals?: number; // For ERC20 Mint and ERC20 Vault
	baseUri?: string; // For ERC1155
	contractUri?: string; // For ERC1155
	tokenId?: number; // For ERC1155
	vaultManagerAddress?: string; // Address that can withdraw funds from vault
}

// Per-org contract functions

export function getAllowance(slashTipAddress: Hex, userId: string) {
	const contract = getSlashTipContract(slashTipAddress);
	return contract.read.allowanceOf([userId]);
}

export function getUserAddress(userRegistryAddress: Hex, userId: string) {
	const contract = getUserRegistryContract(userRegistryAddress);
	return contract.read.getUserAddress([userId]);
}

export function getUser(userRegistryAddress: Hex, userId: string) {
	const contract = getUserRegistryContract(userRegistryAddress);
	return contract.read.getUser([userId]).then((user) => ({
		...user,
		id: userId,
	}));
}

export async function getUserExists(userRegistryAddress: Hex, userId: string) {
	try {
		const contract = getUserRegistryContract(userRegistryAddress);
		const user = await contract.read.getUser([userId]);
		return user.id === userId;
	} catch (e) {
		return false;
	}
}

export async function addAllowanceForAllUsers(
	userRegistryAddress: Hex,
	amount: number,
) {
	const contract = getUserRegistryContract(userRegistryAddress);
	return contract.write.addAllowanceForAllUsers([BigInt(amount)]);
}

export async function setAllowanceForAllUsers(
	userRegistryAddress: Hex,
	amount: number,
) {
	const contract = getUserRegistryContract(userRegistryAddress);
	return contract.write.setAllowanceForAllUsers([BigInt(amount)]);
}

export async function register({
	userRegistryAddress,
	id,
	nickname,
	address,
	allowance,
}: {
	userRegistryAddress: Hex;
	id: string;
	nickname: string;
	address: Hex;
	allowance: number;
}) {
	const contract = getUserRegistryContract(userRegistryAddress);
	return contract.write.addUser([
		id,
		{
			id,
			nickname,
			account: address,
			allowance: BigInt(allowance),
		},
	]);
}

// Syndicate-based allowance functions (for non-wallet transactions)
export async function addAllowanceForAllUsersViaSyndicate(
	userRegistryAddress: string,
	amount: number,
) {
	const { transactionId } = await syndicate.transact.sendTransaction({
		chainId,
		projectId,
		contractAddress: userRegistryAddress,
		functionSignature: "addAllowanceForAllUsers(uint256 _amount)",
		args: {
			_amount: amount,
		},
	});
	try {
		return await waitForHash(syndicate, {
			projectId,
			transactionId,
			every: 250,
			maxAttempts: 4,
		});
	} catch (e) {
		console.error(
			`[add-allowance] could not get transaction hash for ${transactionId} in reasonable amount of time`,
		);
		return null;
	}
}

// Syndicate-based registration (for non-wallet transactions)
export async function registerViaSyndicate({
	userRegistryAddress,
	id,
	nickname,
	address,
	allowance,
}: {
	userRegistryAddress: string;
	id: string;
	nickname: string;
	address: string;
	allowance: number;
}) {
	const { transactionId } = await syndicate.transact.sendTransaction({
		chainId,
		projectId,
		contractAddress: userRegistryAddress,
		functionSignature:
			"addUser(string _id, (string id, string nickname, address account, uint256 allowance) _user)",
		args: {
			_id: id,
			_user: {
				id,
				nickname,
				account: address,
				allowance,
			},
		},
	});
	try {
		return await waitForHash(syndicate, {
			projectId,
			transactionId,
			every: 250,
			maxAttempts: 2,
		});
	} catch (e) {
		console.error(
			`[register-user] could not get transaction hash for ${transactionId} in reasonable amount of time`,
		);
		return null;
	}
}
