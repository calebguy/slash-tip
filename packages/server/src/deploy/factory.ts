import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { env, optionalEnv } from "../env";

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
});

// Factory constants
const FACTORY_ADDRESS = optionalEnv.SLASH_TIP_FACTORY_ADDRESS || "";
const CHAIN_ID = 8453; // Base mainnet
const PROJECT_ID = "570119ce-a49c-4245-8851-11c9d1ad74c7";

// Admin address that will own deployed contracts (Syndicate relayer)
const ADMIN_ADDRESS = optionalEnv.SLASH_TIP_ADMIN_ADDRESS || "";

// Viem client for reading from contracts
const publicClient = createPublicClient({
	chain: base,
	transport: http(env.BASE_RPC_URL),
});

// Factory ABI for getOrg function
const factoryAbi = [
	{
		name: "getOrg",
		type: "function",
		stateMutability: "view",
		inputs: [{ name: "_orgId", type: "string" }],
		outputs: [
			{
				name: "",
				type: "tuple",
				components: [
					{ name: "slashTip", type: "address" },
					{ name: "userRegistry", type: "address" },
					{ name: "tipAction", type: "address" },
					{ name: "tipToken", type: "address" },
					{ name: "exists", type: "bool" },
				],
			},
		],
	},
] as const;

export interface OrgAddresses {
	slashTipAddress: string;
	userRegistryAddress: string;
	tipActionAddress: string;
	tipTokenAddress: string;
}

export interface DeploymentResult {
	success: boolean;
	transactionHash?: string;
	addresses?: OrgAddresses;
	error?: string;
}

/**
 * Query the factory contract to get deployed addresses for an org
 */
export async function getOrgAddresses(orgId: string): Promise<OrgAddresses | null> {
	if (!FACTORY_ADDRESS) {
		console.error("SLASH_TIP_FACTORY_ADDRESS not set");
		return null;
	}

	try {
		const result = await publicClient.readContract({
			address: FACTORY_ADDRESS as `0x${string}`,
			abi: factoryAbi,
			functionName: "getOrg",
			args: [orgId],
		});

		if (!result.exists) {
			console.log(`Org ${orgId} not found in factory`);
			return null;
		}

		return {
			slashTipAddress: result.slashTip,
			userRegistryAddress: result.userRegistry,
			tipActionAddress: result.tipAction,
			tipTokenAddress: result.tipToken,
		};
	} catch (error) {
		console.error(`Failed to get org addresses for ${orgId}:`, error);
		return null;
	}
}

export interface ERC1155DeploymentConfig {
	orgId: string;
	baseUri: string;
	contractUri: string;
	tokenId: number;
}

export interface ERC20DeploymentConfig {
	orgId: string;
	tokenName: string;
	tokenSymbol: string;
	decimals: number;
}

export interface ERC20VaultDeploymentConfig {
	orgId: string;
	tokenAddress: string;
}

/**
 * Deploy a new ERC1155 tip setup for an organization
 */
export async function deployERC1155(
	config: ERC1155DeploymentConfig,
): Promise<DeploymentResult> {
	if (!FACTORY_ADDRESS) {
		console.error("SLASH_TIP_FACTORY_ADDRESS not set");
		return { success: false, error: "Factory not configured" };
	}

	if (!ADMIN_ADDRESS) {
		console.error("SLASH_TIP_ADMIN_ADDRESS not set");
		return { success: false, error: "Admin address not configured" };
	}

	console.log("Deploying ERC1155 setup:", config);

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithERC1155(string _orgId, address _admin, string _tokenBaseURI, string _contractURI, uint256 _tokenId)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_tokenBaseURI: config.baseUri || "",
				_contractURI: config.contractUri || "",
				_tokenId: config.tokenId,
			},
		});

		const hash = await waitForHash(syndicate, {
			projectId: PROJECT_ID,
			transactionId,
			every: 500,
			maxAttempts: 60,
		});

		console.log(`ERC1155 deployment transaction: ${hash}`);

		return {
			success: true,
			transactionHash: hash,
		};
	} catch (error) {
		console.error("ERC1155 deployment failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Deployment failed",
		};
	}
}

/**
 * Deploy a new ERC20 tip setup for an organization
 */
export async function deployERC20(
	config: ERC20DeploymentConfig,
): Promise<DeploymentResult> {
	if (!FACTORY_ADDRESS) {
		console.error("SLASH_TIP_FACTORY_ADDRESS not set");
		return { success: false, error: "Factory not configured" };
	}

	if (!ADMIN_ADDRESS) {
		console.error("SLASH_TIP_ADMIN_ADDRESS not set");
		return { success: false, error: "Admin address not configured" };
	}

	console.log("Deploying ERC20 setup:", config);

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithERC20(string _orgId, address _admin, string _tokenName, string _tokenSymbol, uint8 _tokenDecimals)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_tokenName: config.tokenName,
				_tokenSymbol: config.tokenSymbol,
				_tokenDecimals: config.decimals,
			},
		});

		const hash = await waitForHash(syndicate, {
			projectId: PROJECT_ID,
			transactionId,
			every: 500,
			maxAttempts: 60,
		});

		console.log(`ERC20 deployment transaction: ${hash}`);

		return {
			success: true,
			transactionHash: hash,
		};
	} catch (error) {
		console.error("ERC20 deployment failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Deployment failed",
		};
	}
}

/**
 * Deploy an ERC20 vault tip setup for an organization (uses existing token)
 */
export async function deployERC20Vault(
	config: ERC20VaultDeploymentConfig,
): Promise<DeploymentResult> {
	if (!FACTORY_ADDRESS) {
		console.error("SLASH_TIP_FACTORY_ADDRESS not set");
		return { success: false, error: "Factory not configured" };
	}

	if (!ADMIN_ADDRESS) {
		console.error("SLASH_TIP_ADMIN_ADDRESS not set");
		return { success: false, error: "Admin address not configured" };
	}

	console.log("Deploying ERC20 Vault setup:", config);

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithERC20Vault(string _orgId, address _admin, address _token)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_token: config.tokenAddress,
			},
		});

		const hash = await waitForHash(syndicate, {
			projectId: PROJECT_ID,
			transactionId,
			every: 500,
			maxAttempts: 60,
		});

		console.log(`ERC20 Vault deployment transaction: ${hash}`);

		return {
			success: true,
			transactionHash: hash,
		};
	} catch (error) {
		console.error("ERC20 Vault deployment failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Deployment failed",
		};
	}
}
