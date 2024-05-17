import { SyndicateClient } from "@syndicateio/syndicate-node";
import { env } from "./env";

const syndicate = new SyndicateClient({
  token: env.SYNDICATE_API_KEY,
})

const contractAddress = "0x0aa9c1137b3ff552Eb5e0fF1e18A1F59D854df81";

export function mint({from, to, amount}: {from: string, to: string, amount: number}) {
  return syndicate.transact.sendTransaction({
    contractAddress,
    chainId: 8453,
    projectId: "570119ce-a49c-4245-8851-11c9d1ad74c7",
    functionSignature: "tip(string from, string to, uint256 tokenId, uint256 amount)",
    args: {
      tokenId: 0,
      from,
      to,
      amount
    }
  })
}

