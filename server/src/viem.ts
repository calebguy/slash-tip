import { createPublicClient, createWalletClient, getContract, http } from "viem"
import { base } from "viem/chains"

import slashTipABI from "./abi/slashTip"
import tipABI from "./abi/tip"
import userRegistryABI from "./abi/userRegistry"
import {
	SLASH_TIP_ADDRESS,
	TIP_ADDRESS,
	USER_REGISTRY_ADDRESS,
} from "./constants"
import { privateKeyToAccount } from "viem/accounts"
import { env } from "./env"

const rpcUrl = env.BASE_RPC_URL

const publicClient = createPublicClient({
	chain: base,
	transport: http(rpcUrl),
})

const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY)
export const walletClient = createWalletClient({
	account,
	chain: base,
	transport: http(rpcUrl),
})

export const slashTipContract = getContract({
	address: SLASH_TIP_ADDRESS,
	abi: slashTipABI,
	client: { public: publicClient, wallet: walletClient },
})

export const userRegistryContract = getContract({
	address: USER_REGISTRY_ADDRESS,
	abi: userRegistryABI,
	client: { public: publicClient, wallet: walletClient },
})

export const tipContract = getContract({
	address: TIP_ADDRESS,
	abi: tipABI,
	client: { public: publicClient, wallet: walletClient },
})
