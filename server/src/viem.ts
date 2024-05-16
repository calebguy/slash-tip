import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

import slashTipAbi from "./abi/SlashTip.json"


const USER_REGISTRY_ADDRESS = "0x5F7aBf7063e1e78A32f144F5796715d7B66c521E"
const TIP_ADDRESS = "0xA19e91f5c794BBe0632cC14bB51Db434573246e2"
const SLASH_TIP_ADDRESS = "0x0aa9c1137b3ff552Eb5e0fF1e18A1F59D854df81"

const publicClient = createPublicClient({ 
  chain: base,
  transport: http()
})

export async function getBalance(userId: string): Promise<bigint> {
  return publicClient.readContract({
    address: SLASH_TIP_ADDRESS,
    abi: slashTipAbi,
    functionName: 'balanceOf(string)',
    args: [userId]
  }) as Promise<bigint>
}
