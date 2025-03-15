import {
	createPublicClient,
	createWalletClient,
	getContract,
	http,
	type Hex,
} from "viem";
import { base, mainnet } from "viem/chains";

import SlashTipAbi from "utils/src/abis/SlashTipAbi";
import UserRegistryAbi from "utils/src/abis/UserRegistryAbi";
import { privateKeyToAccount } from "viem/accounts";
import { normalize } from "viem/ens";
import { SLASH_TIP_ADDRESS, USER_REGISTRY_ADDRESS } from "./constants";
import { env } from "./env";

const rpcUrl = env.BASE_RPC_URL;

const baseClient = createPublicClient({
	chain: base,
	transport: http(rpcUrl),
});

const mainnetClient = createPublicClient({
	chain: mainnet,
	transport: http("https://eth.llamarpc.com"),
});

const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY);
export const walletClient = createWalletClient({
	account,
	chain: base,
	transport: http(rpcUrl),
});

export const slashTipContract = getContract({
	address: SLASH_TIP_ADDRESS,
	abi: SlashTipAbi,
	client: { public: baseClient, wallet: walletClient },
});

export const userRegistryContract = getContract({
	address: USER_REGISTRY_ADDRESS,
	abi: UserRegistryAbi,
	client: { public: baseClient, wallet: walletClient },
});

export const getAddressFromENS = (ens: string): Promise<Hex | null> => {
	return mainnetClient.getEnsAddress({
		name: normalize(ens),
	});
};
