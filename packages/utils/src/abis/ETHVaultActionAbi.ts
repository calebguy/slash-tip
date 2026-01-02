export const ETHVaultActionAbi = [
	{
		type: "constructor",
		inputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "receive",
		stateMutability: "payable",
	},
	{
		type: "function",
		name: "DEFAULT_ADMIN_ROLE",
		inputs: [],
		outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "VAULT_MANAGER",
		inputs: [],
		outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "initialize",
		inputs: [{ name: "_admin", type: "address", internalType: "address" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "execute",
		inputs: [
			{ name: "from", type: "address", internalType: "address" },
			{ name: "to", type: "address", internalType: "address" },
			{ name: "amount", type: "uint256", internalType: "uint256" },
			{ name: "data", type: "bytes", internalType: "bytes" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "deposit",
		inputs: [],
		outputs: [],
		stateMutability: "payable",
	},
	{
		type: "function",
		name: "withdraw",
		inputs: [
			{ name: "_to", type: "address", internalType: "address" },
			{ name: "_amount", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "vaultBalance",
		inputs: [],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "rescueTokens",
		inputs: [
			{ name: "_token", type: "address", internalType: "address" },
			{ name: "_to", type: "address", internalType: "address" },
			{ name: "_amount", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "Deposit",
		inputs: [
			{ name: "from", type: "address", indexed: true, internalType: "address" },
			{ name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "Withdrawal",
		inputs: [
			{ name: "to", type: "address", indexed: true, internalType: "address" },
			{ name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "InsufficientVaultBalance",
		inputs: [
			{ name: "available", type: "uint256", internalType: "uint256" },
			{ name: "required", type: "uint256", internalType: "uint256" },
		],
	},
	{
		type: "error",
		name: "ETHTransferFailed",
		inputs: [],
	},
] as const;

export default ETHVaultActionAbi;
