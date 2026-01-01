import { createConfig, factory } from "ponder";
import { http, parseAbiItem } from "viem";
import { SlashTipFactoryAbi } from "utils/src/abis/SlashTipFactoryAbi";
import { SlashTipAbi } from "utils/src/abis/SlashTipAbi";
import { UserRegistryAbi } from "utils/src/abis/UserRegistryAbi";
import { SLASH_TIP_FACTORY_START_BLOCK } from "utils/src/constants";

// Factory address from environment
const FACTORY_ADDRESS = process.env.SLASH_TIP_FACTORY_ADDRESS as `0x${string}`;

if (!FACTORY_ADDRESS) {
	throw new Error("SLASH_TIP_FACTORY_ADDRESS environment variable is required");
}

// OrgDeployed event signature for factory pattern
const ORG_DEPLOYED_EVENT = parseAbiItem(
	"event OrgDeployed(string indexed orgId, address indexed admin, address slashTip, address userRegistry, address tipAction, address tipToken)"
);

export default createConfig({
	networks: {
		base: {
			chainId: 8453,
			transport: http(process.env.PONDER_RPC_URL_BASE),
		},
	},
	contracts: {
		// Index factory itself to capture OrgDeployed events
		SlashTipFactory: {
			network: "base",
			abi: SlashTipFactoryAbi,
			address: FACTORY_ADDRESS,
			startBlock: SLASH_TIP_FACTORY_START_BLOCK,
		},
		// Dynamically index all SlashTip instances deployed by factory
		SlashTip: {
			network: "base",
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
			network: "base",
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
