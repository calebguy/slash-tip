import { Hex, createPublicClient, http } from "viem"
import { base } from "viem/chains"

import userRegistryAbi from "./abi/UserRegistry.json"

const USER_REGISTRY_ADDRESS = "0xb3029a3c2e70900F334c449D1691D4219cC71953"
const TIP_ADDRESS = "0x06f0C031e9AC472ffac5D72434CF9eBC66f788F7"
const SLASH_TIP_ADDRESS = "0xBd124A7D405c41fa2281603F39531d7E5D67C103"

const publicClient = createPublicClient({ 
  chain: base,
  transport: http()
})

export async function getBalance(userId: string) {
  const address = await publicClient.readContract({
    address: USER_REGISTRY_ADDRESS,
    abi: userRegistryAbi,
    functionName: 'getUserAddress',
    args: [userId]
  })
  return publicClient.getBalance({ address: address as Hex })
}
