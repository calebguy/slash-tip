import { createConfig, factory } from "ponder";
import { SlashTipAbi } from "utils/src/abis/SlashTipAbi";
import { SlashTipFactoryAbi } from "utils/src/abis/SlashTipFactoryAbi";
import { UserRegistryAbi } from "utils/src/abis/UserRegistryAbi";
import { parseAbiItem } from "viem";

export const SLASH_TIP_FACTORY_START_BLOCK = 40850000;

// Factory address from environment
const FACTORY_ADDRESS = process.env.SLASH_TIP_FACTORY_ADDRESS as `0x${string}`;

if (!FACTORY_ADDRESS) {
	throw new Error("SLASH_TIP_FACTORY_ADDRESS environment variable is required");
}

// OrgDeployed event signature for factory pattern
const ORG_DEPLOYED_EVENT = parseAbiItem(
	"event OrgDeployed(string indexed orgIdHash, string orgId, address indexed admin, address slashTip, address userRegistry, address tipAction, address tipToken)",
);

export default createConfig({
	chains: {
		base: {
			id: 8453,
			rpc: process.env.RPC_URL_BASE,
			ws: process.env.WS_RPC_URL_BASE,
		},
	},
	contracts: {
		// Index factory itself to capture OrgDeployed events
		SlashTipFactory: {
			chain: "base",
			abi: SlashTipFactoryAbi,
			address: FACTORY_ADDRESS,
			startBlock: SLASH_TIP_FACTORY_START_BLOCK,
		},
		// Dynamically index all SlashTip instances deployed by factory
		SlashTip: {
			chain: "base",
			abi: SlashTipAbi,
			address: factory({
				address: FACTORY_ADDRESS,
				event: ORG_DEPLOYED_EVENT,
				parameter: "slashTip",
			}),
			startBlock: SLASH_TIP_FACTORY_START_BLOCK,
		},
		// Dynamically index all UserRegistry instances deployed by factory
		UserRegistry: {
			chain: "base",
			abi: UserRegistryAbi,
			address: factory({
				address: FACTORY_ADDRESS,
				event: ORG_DEPLOYED_EVENT,
				parameter: "userRegistry",
			}),
			startBlock: SLASH_TIP_FACTORY_START_BLOCK,
		},
	},
});
