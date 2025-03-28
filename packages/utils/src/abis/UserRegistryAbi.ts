export const UserRegistryAbi = [
	{
		type: "constructor",
		inputs: [
			{
				name: "_admin",
				type: "address",
				internalType: "address",
			},
			{
				name: "_description",
				type: "string",
				internalType: "string",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "DEFAULT_ADMIN_ROLE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "bytes32",
				internalType: "bytes32",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "addUser",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
			{
				name: "_user",
				type: "tuple",
				internalType: "struct UserRegistry.User",
				components: [
					{
						name: "id",
						type: "string",
						internalType: "string",
					},
					{
						name: "nickname",
						type: "string",
						internalType: "string",
					},
					{
						name: "account",
						type: "address",
						internalType: "address",
					},
					{
						name: "allowance",
						type: "uint256",
						internalType: "uint256",
					},
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
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
			{
				name: "_plus",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "description",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "string",
				internalType: "string",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getRoleAdmin",
		inputs: [
			{
				name: "role",
				type: "bytes32",
				internalType: "bytes32",
			},
		],
		outputs: [
			{
				name: "",
				type: "bytes32",
				internalType: "bytes32",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getUser",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
		],
		outputs: [
			{
				name: "",
				type: "tuple",
				internalType: "struct UserRegistry.User",
				components: [
					{
						name: "id",
						type: "string",
						internalType: "string",
					},
					{
						name: "nickname",
						type: "string",
						internalType: "string",
					},
					{
						name: "account",
						type: "address",
						internalType: "address",
					},
					{
						name: "allowance",
						type: "uint256",
						internalType: "uint256",
					},
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getUserAddress",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
		],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getUserAllowance",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "grantRole",
		inputs: [
			{
				name: "role",
				type: "bytes32",
				internalType: "bytes32",
			},
			{
				name: "account",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "hasRole",
		inputs: [
			{
				name: "role",
				type: "bytes32",
				internalType: "bytes32",
			},
			{
				name: "account",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "",
				type: "bool",
				internalType: "bool",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "idToUser",
		inputs: [
			{
				name: "",
				type: "string",
				internalType: "string",
			},
		],
		outputs: [
			{
				name: "id",
				type: "string",
				internalType: "string",
			},
			{
				name: "nickname",
				type: "string",
				internalType: "string",
			},
			{
				name: "account",
				type: "address",
				internalType: "address",
			},
			{
				name: "allowance",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
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
					{
						name: "id",
						type: "string",
						internalType: "string",
					},
					{
						name: "nickname",
						type: "string",
						internalType: "string",
					},
					{
						name: "account",
						type: "address",
						internalType: "address",
					},
					{
						name: "allowance",
						type: "uint256",
						internalType: "uint256",
					},
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "removeUser",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "renounceRole",
		inputs: [
			{
				name: "role",
				type: "bytes32",
				internalType: "bytes32",
			},
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
			{
				name: "role",
				type: "bytes32",
				internalType: "bytes32",
			},
			{
				name: "account",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "setUserAllowance",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
			{
				name: "_allowance",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "subUserAllowance",
		inputs: [
			{
				name: "_id",
				type: "string",
				internalType: "string",
			},
			{
				name: "_sub",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "supportsInterface",
		inputs: [
			{
				name: "interfaceId",
				type: "bytes4",
				internalType: "bytes4",
			},
		],
		outputs: [
			{
				name: "",
				type: "bool",
				internalType: "bool",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "userIds",
		inputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "string",
				internalType: "string",
			},
		],
		stateMutability: "view",
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
		name: "UserAdded",
		inputs: [
			{
				name: "id",
				type: "string",
				indexed: false,
				internalType: "string",
			},
			{
				name: "nickname",
				type: "string",
				indexed: false,
				internalType: "string",
			},
			{
				name: "account",
				type: "address",
				indexed: false,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "UserRemoved",
		inputs: [
			{
				name: "id",
				type: "string",
				indexed: false,
				internalType: "string",
			},
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "AccessControlBadConfirmation",
		inputs: [],
	},
	{
		type: "error",
		name: "AccessControlUnauthorizedAccount",
		inputs: [
			{
				name: "account",
				type: "address",
				internalType: "address",
			},
			{
				name: "neededRole",
				type: "bytes32",
				internalType: "bytes32",
			},
		],
	},
] as const;
export default UserRegistryAbi;
