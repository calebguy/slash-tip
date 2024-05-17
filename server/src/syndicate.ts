import { SyndicateClient } from "@syndicateio/syndicate-node";
import { SLASH_TIP_ADDRESS, USER_REGISTRY_ADDRESS } from "./constants";
import { env } from "./env";

const syndicate = new SyndicateClient({
  token: env.SYNDICATE_API_KEY,
})

const chainId = 8453
const projectId = "570119ce-a49c-4245-8851-11c9d1ad74c7"

export function mint({from, to, amount}: {from: string, to: string, amount: number}) {
  return syndicate.transact.sendTransaction({
    chainId,
    projectId,
    contractAddress: SLASH_TIP_ADDRESS,
    functionSignature: "tip(string from, string to, uint256 tokenId, uint256 amount)",
    args: {
      tokenId: 0,
      from,
      to,
      amount
    }
  })
}

export function registerUser({id, nickname, address}: {id: string, nickname: string, address: string}) {
  return syndicate.transact.sendTransaction({
    chainId,
    projectId,
    contractAddress: USER_REGISTRY_ADDRESS,
    functionSignature: "addUser(string id, (string nickname, address account, uint256 allowance) user)",
    args: {
      id,
      user: {
        nickname,
        account: address,
        allowance: 5
      }
    }
  })
}

