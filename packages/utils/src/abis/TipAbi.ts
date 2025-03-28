export const TipAbi = [
	{
		type: "constructor",
		inputs: [
			{ name: "_admin", type: "address", internalType: "address" },
			{ name: "_baseURI", type: "string", internalType: "string" },
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
		name: "balanceOf",
		inputs: [
			{ name: "", type: "address", internalType: "address" },
			{ name: "", type: "uint256", internalType: "uint256" },
		],
		outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "balanceOfBatch",
		inputs: [
			{ name: "owners", type: "address[]", internalType: "address[]" },
			{ name: "ids", type: "uint256[]", internalType: "uint256[]" },
		],
		outputs: [
			{ name: "balances", type: "uint256[]", internalType: "uint256[]" },
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "baseURI",
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
		name: "isApprovedForAll",
		inputs: [
			{ name: "", type: "address", internalType: "address" },
			{ name: "", type: "address", internalType: "address" },
		],
		outputs: [{ name: "", type: "bool", internalType: "bool" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "mint",
		inputs: [
			{ name: "_account", type: "address", internalType: "address" },
			{ name: "_id", type: "uint256", internalType: "uint256" },
			{ name: "_amount", type: "uint256", internalType: "uint256" },
			{ name: "_data", type: "bytes", internalType: "bytes" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "renounceRole",
		inputs: [
			{ name: "role", type: "bytes32", internalType: "bytes32" },
			{
				name: "callerConfirmation",
				type: "address",
				internalType: "address",
			},
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
		name: "safeBatchTransferFrom",
		inputs: [
			{ name: "from", type: "address", internalType: "address" },
			{ name: "to", type: "address", internalType: "address" },
			{ name: "ids", type: "uint256[]", internalType: "uint256[]" },
			{ name: "amounts", type: "uint256[]", internalType: "uint256[]" },
			{ name: "data", type: "bytes", internalType: "bytes" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "safeTransferFrom",
		inputs: [
			{ name: "from", type: "address", internalType: "address" },
			{ name: "to", type: "address", internalType: "address" },
			{ name: "id", type: "uint256", internalType: "uint256" },
			{ name: "amount", type: "uint256", internalType: "uint256" },
			{ name: "data", type: "bytes", internalType: "bytes" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setApprovalForAll",
		inputs: [
			{ name: "operator", type: "address", internalType: "address" },
			{ name: "approved", type: "bool", internalType: "bool" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setBaseURI",
		inputs: [{ name: "_baseURI", type: "string", internalType: "string" }],
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
		name: "uri",
		inputs: [{ name: "_id", type: "uint256", internalType: "uint256" }],
		outputs: [{ name: "", type: "string", internalType: "string" }],
		stateMutability: "view",
	},
	{
		type: "event",
		name: "ApprovalForAll",
		inputs: [
			{
				name: "owner",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "operator",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "approved",
				type: "bool",
				indexed: false,
				internalType: "bool",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "RoleAdminChanged",
		inputs: [
			{
				name: "role",
				type: "bytes32",
				indexed: true,
				internalType: "bytes32",
			},
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
			{
				name: "role",
				type: "bytes32",
				indexed: true,
				internalType: "bytes32",
			},
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
			{
				name: "role",
				type: "bytes32",
				indexed: true,
				internalType: "bytes32",
			},
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
		name: "TransferBatch",
		inputs: [
			{
				name: "operator",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "from",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "to",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "ids",
				type: "uint256[]",
				indexed: false,
				internalType: "uint256[]",
			},
			{
				name: "amounts",
				type: "uint256[]",
				indexed: false,
				internalType: "uint256[]",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "TransferSingle",
		inputs: [
			{
				name: "operator",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "from",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "to",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "id",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "amount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "URI",
		inputs: [
			{
				name: "value",
				type: "string",
				indexed: false,
				internalType: "string",
			},
			{
				name: "id",
				type: "uint256",
				indexed: true,
				internalType: "uint256",
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

export default TipAbi;
