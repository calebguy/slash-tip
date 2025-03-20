export const SlashTipAbi = [
	{
		type: "constructor",
		inputs: [
			{ name: "_admin", type: "address", internalType: "address" },
			{ name: "_userRegistry", type: "address", internalType: "address" },
			{ name: "_tipToken", type: "address", internalType: "address" },
			{ name: "_description", type: "string", internalType: "string" },
		],
		stateMutability: "nonpayable",
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
		name: "addAllowanceForAllUsers",
		inputs: [{ name: "_amount", type: "uint256", internalType: "uint256" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "allowanceOf",
		inputs: [{ name: "_userId", type: "string", internalType: "string" }],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [
			{ name: "_userId", type: "string", internalType: "string" },
			{ name: "_tokenId", type: "uint256", internalType: "uint256" },
		],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "description",
		inputs: [],
		outputs: [{ name: "", type: "string", internalType: "string" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getRoleAdmin",
		inputs: [{ name: "role", type: "bytes32", internalType: "bytes32" }],
		outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "grantRole",
		inputs: [
			{ name: "role", type: "bytes32", internalType: "bytes32" },
			{ name: "account", type: "address", internalType: "address" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "hasRole",
		inputs: [
			{ name: "role", type: "bytes32", internalType: "bytes32" },
			{ name: "account", type: "address", internalType: "address" },
		],
		outputs: [{ name: "", type: "bool", internalType: "bool" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "leaderboard",
		inputs: [{ name: "_tokenId", type: "uint256", internalType: "uint256" }],
		outputs: [
			{
				name: "",
				type: "tuple[]",
				internalType: "struct SlashTip.UserWithBalance[]",
				components: [
					{
						name: "user",
						type: "tuple",
						internalType: "struct UserRegistry.User",
						components: [
							{ name: "id", type: "string", internalType: "string" },
							{ name: "nickname", type: "string", internalType: "string" },
							{ name: "account", type: "address", internalType: "address" },
							{ name: "allowance", type: "uint256", internalType: "uint256" },
						],
					},
					{ name: "balance", type: "uint256", internalType: "uint256" },
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "renounceRole",
		inputs: [
			{ name: "role", type: "bytes32", internalType: "bytes32" },
			{ name: "callerConfirmation", type: "address", internalType: "address" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "revokeRole",
		inputs: [
			{ name: "role", type: "bytes32", internalType: "bytes32" },
			{ name: "account", type: "address", internalType: "address" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setAllowanceForAllUsers",
		inputs: [{ name: "_amount", type: "uint256", internalType: "uint256" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setTipToken",
		inputs: [{ name: "_tipToken", type: "address", internalType: "address" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setUserRegistry",
		inputs: [
			{ name: "_userRegistry", type: "address", internalType: "address" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "supportsInterface",
		inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }],
		outputs: [{ name: "", type: "bool", internalType: "bool" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "tip",
		inputs: [
			{ name: "_fromId", type: "string", internalType: "string" },
			{ name: "_toId", type: "string", internalType: "string" },
			{ name: "_tokenId", type: "uint256", internalType: "uint256" },
			{ name: "_amount", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "tipToken",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "contract Tip" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "userRegistry",
		inputs: [],
		outputs: [
			{ name: "", type: "address", internalType: "contract UserRegistry" },
		],
		stateMutability: "view",
	},
	{
		type: "event",
		name: "RoleAdminChanged",
		inputs: [
			{ name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
			{
				name: "previousAdminRole",
				type: "bytes32",
				indexed: true,
				internalType: "bytes32",
			},
			{
				name: "newAdminRole",
				type: "bytes32",
				indexed: true,
				internalType: "bytes32",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "RoleGranted",
		inputs: [
			{ name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
			{
				name: "account",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "sender",
				type: "address",
				indexed: true,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "RoleRevoked",
		inputs: [
			{ name: "role", type: "bytes32", indexed: true, internalType: "bytes32" },
			{
				name: "account",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "sender",
				type: "address",
				indexed: true,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{ type: "error", name: "AccessControlBadConfirmation", inputs: [] },
	{
		type: "error",
		name: "AccessControlUnauthorizedAccount",
		inputs: [
			{ name: "account", type: "address", internalType: "address" },
			{ name: "neededRole", type: "bytes32", internalType: "bytes32" },
		],
	},
] as const;

export default SlashTipAbi;
