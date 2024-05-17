import { createPublicClient, getContract, http } from "viem"
import { base } from "viem/chains"

import slashTipABI from "./abi/slashTip"
import tipABI from "./abi/tip"
import userRegistryABI from "./abi/userRegistry"
import { SLASH_TIP_ADDRESS, TIP_ADDRESS, USER_REGISTRY_ADDRESS } from "./constants"

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

export function getBalance(userId: string): Promise<bigint> {
	return slashTip.read.balanceOf([userId, BigInt(tokenId)])
}

export function getAllowance(userId: string) {
  return slashTip.read.allowanceOf([userId])
}

export function getUserAddress(userId: string) {
  return userRegistry.read.getUserAddress([userId])
}
