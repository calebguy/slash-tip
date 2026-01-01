export const UserRegistryAbi = [
	{
		type: "constructor",
		inputs: [],
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
		name: "REGISTRY_MANAGER",
		inputs: [],
		outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "addUser",
		inputs: [
			{ name: "_id", type: "string", internalType: "string" },
			{
				name: "_user",
				type: "tuple",
				internalType: "struct UserRegistry.User",
				components: [
					{ name: "id", type: "string", internalType: "string" },
					{ name: "nickname", type: "string", internalType: "string" },
					{ name: "account", type: "address", internalType: "address" },
					{ name: "allowance", type: "uint256", internalType: "uint256" },
				],
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "addUserAllowance",
		inputs: [
			{ name: "_id", type: "string", internalType: "string" },
			{ name: "_plus", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "getUser",
		inputs: [{ name: "_id", type: "string", internalType: "string" }],
		outputs: [
			{
				name: "",
				type: "tuple",
				internalType: "struct UserRegistry.User",
				components: [
					{ name: "id", type: "string", internalType: "string" },
					{ name: "nickname", type: "string", internalType: "string" },
					{ name: "account", type: "address", internalType: "address" },
					{ name: "allowance", type: "uint256", internalType: "uint256" },
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getUserAddress",
		inputs: [{ name: "_id", type: "string", internalType: "string" }],
		outputs: [{ name: "", type: "address", internalType: "address" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getUserAllowance",
		inputs: [{ name: "_id", type: "string", internalType: "string" }],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "initialize",
		inputs: [
			{ name: "_admin", type: "address", internalType: "address" },
			{ name: "_orgId", type: "string", internalType: "string" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "listUsers",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "tuple[]",
				internalType: "struct UserRegistry.User[]",
				components: [
					{ name: "id", type: "string", internalType: "string" },
					{ name: "nickname", type: "string", internalType: "string" },
					{ name: "account", type: "address", internalType: "address" },
					{ name: "allowance", type: "uint256", internalType: "uint256" },
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "orgId",
		inputs: [],
		outputs: [{ name: "", type: "string", internalType: "string" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "removeUser",
		inputs: [{ name: "_id", type: "string", internalType: "string" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setUserAllowance",
		inputs: [
			{ name: "_id", type: "string", internalType: "string" },
			{ name: "_allowance", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "subUserAllowance",
		inputs: [
			{ name: "_id", type: "string", internalType: "string" },
			{ name: "_sub", type: "uint256", internalType: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "UserAdded",
		inputs: [
			{ name: "id", type: "string", indexed: true, internalType: "string" },
			{ name: "nickname", type: "string", indexed: false, internalType: "string" },
			{ name: "account", type: "address", indexed: true, internalType: "address" },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "UserRemoved",
		inputs: [{ name: "id", type: "string", indexed: true, internalType: "string" }],
		anonymous: false,
	},
	{
		type: "event",
		name: "AllowanceUpdated",
		inputs: [
			{ name: "id", type: "string", indexed: true, internalType: "string" },
			{ name: "oldAllowance", type: "uint256", indexed: false, internalType: "uint256" },
			{ name: "newAllowance", type: "uint256", indexed: false, internalType: "uint256" },
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "Initialized",
		inputs: [{ name: "version", type: "uint64", indexed: false, internalType: "uint64" }],
		anonymous: false,
	},
] as const;

export default UserRegistryAbi;
