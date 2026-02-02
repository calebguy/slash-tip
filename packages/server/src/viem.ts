import { createPublicClient, getContract, http, type Hex } from "viem";
import { base, mainnet } from "viem/chains";

import { SlashTipAbi } from "utils/src/abis/SlashTipAbi";
import { UserRegistryAbi } from "utils/src/abis/UserRegistryAbi";
import { normalize } from "viem/ens";
import { env } from "./env";

const rpcUrl = env.BASE_RPC_URL;

export const baseClient = createPublicClient({
	chain: base,
	transport: http(rpcUrl),
});

const mainnetClient = createPublicClient({
	chain: mainnet,
	transport: http("https://eth.llamarpc.com"),
});

// Create a SlashTip contract instance for a specific org
export function getSlashTipContract(address: Hex) {
	return getContract({
		address,
		abi: SlashTipAbi,
		client: { public: baseClient },
	});
}

// Create a UserRegistry contract instance for a specific org
export function getUserRegistryContract(address: Hex) {
	return getContract({
		address,
		abi: UserRegistryAbi,
		client: { public: baseClient },
	});
}

export const getAddressFromENS = (ens: string): Promise<Hex | null> => {
	return mainnetClient.getEnsAddress({
		name: normalize(ens),
	});
};
