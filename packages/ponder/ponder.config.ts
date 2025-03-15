import { createConfig } from "ponder";
import { SlashTipAbi } from "utils/src/abis/SlashTipAbi";
import { TipAbi } from "utils/src/abis/TipAbi";
import { UserRegistryAbi } from "utils/src/abis/UserRegistryAbi";
import { http } from "viem";

export default createConfig({
	networks: {
		op: {
			chainId: 10,
			transport: http(process.env.PONDER_RPC_URL_1),
		},
	},
	contracts: {
		Tip: {
			network: "op",
			abi: TipAbi,
			address: "0xA19e91f5c794BBe0632cC14bB51Db434573246e2",
			startBlock: 14510881,
		},
		UserRegistry: {
			network: "op",
			abi: UserRegistryAbi,
			address: "0x952571B5517B97F7153D971706326467Eb698e5D",
			startBlock: 1234567,
		},
		SlashTip: {
			network: "op",
			abi: SlashTipAbi,
			address: "0x4aF53290DB0444638160689E2Ab289256AB66041",
			startBlock: 1234567,
		},
	},
});
