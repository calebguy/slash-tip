import { createConfig } from "ponder";
import { SlashTipAbi } from "utils/src/abis/SlashTipAbi";
import { TipAbi } from "utils/src/abis/TipAbi";
import { UserRegistryAbi } from "utils/src/abis/UserRegistryAbi";
import {
	SLASH_TIP_ADDRESS,
	TIP_ADDRESS,
	USER_REGISTRY_ADDRESS,
} from "utils/src/constants";
import { http } from "viem";
export default createConfig({
	networks: {
		target: {
			chainId: 10,
			transport: http(process.env.PONDER_RPC_URL_1),
		},
	},
	contracts: {
		Tip: {
			network: "target",
			abi: TipAbi,
			address: TIP_ADDRESS,
			startBlock: 14510881,
		},
		UserRegistry: {
			network: "target",
			abi: UserRegistryAbi,
			address: USER_REGISTRY_ADDRESS,
			startBlock: 1234567,
		},
		SlashTip: {
			network: "target",
			abi: SlashTipAbi,
			address: SLASH_TIP_ADDRESS,
			startBlock: 1234567,
		},
	},
});
