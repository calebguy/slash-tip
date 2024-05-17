import { createPublicClient, getContract, http } from "viem"
import { base } from "viem/chains"

import slashTipABI from "./abi/slashTip"
import tipABI from "./abi/tip"
import userRegistryABI from "./abi/userRegistry"

const USER_REGISTRY_ADDRESS = "0x5F7aBf7063e1e78A32f144F5796715d7B66c521E"
const TIP_ADDRESS = "0xA19e91f5c794BBe0632cC14bB51Db434573246e2"
const SLASH_TIP_ADDRESS = "0x0aa9c1137b3ff552Eb5e0fF1e18A1F59D854df81"

const client = createPublicClient({
	chain: base,
	transport: http(),
})

const slashTip = getContract({
	address: SLASH_TIP_ADDRESS,
	abi: slashTipABI,
	client,
})

const userRegistry = getContract({
  address: USER_REGISTRY_ADDRESS,
  abi: userRegistryABI,
  client
})

const tip = getContract({
  address: TIP_ADDRESS,
  abi: tipABI,
  client
})

const tokenId = 0

export async function getBalance(userId: string): Promise<bigint> {
	return slashTip.read.balanceOf([userId, BigInt(tokenId)])
}
