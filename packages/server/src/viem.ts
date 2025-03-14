import {
	createPublicClient,
	createWalletClient,
	getContract,
	http,
	type Hex,
} from "viem";
import { base, mainnet } from "viem/chains";

import { privateKeyToAccount } from "viem/accounts";
import { normalize } from "viem/ens";
import slashTipABI from "./abi/slashTip";
import tipABI from "./abi/tip";
import userRegistryABI from "./abi/userRegistry";
import {
	SLASH_TIP_ADDRESS,
	TIP_ADDRESS,
	USER_REGISTRY_ADDRESS,
} from "./constants";
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
	abi: slashTipABI,
	client: { public: baseClient, wallet: walletClient },
});

export const userRegistryContract = getContract({
	address: USER_REGISTRY_ADDRESS,
	abi: userRegistryABI,
	client: { public: baseClient, wallet: walletClient },
});

export const tipContract = getContract({
	address: TIP_ADDRESS,
	abi: tipABI,
	client: { public: baseClient, wallet: walletClient },
});

export const getAddressFromENS = (ens: string): Promise<Hex | null> => {
	return mainnetClient.getEnsAddress({
		name: normalize(ens),
	});
};
