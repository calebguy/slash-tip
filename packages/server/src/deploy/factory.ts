import { SyndicateClient } from "@syndicateio/syndicate-node";
import { waitForHash } from "@syndicateio/syndicate-node/utils";
import { SlashTipFactoryAbi } from "utils/src/abis/SlashTipFactoryAbi";
import { createPublicClient, http, parseEventLogs, type Hex } from "viem";
import { base } from "viem/chains";
import { env } from "../env";

const syndicate = new SyndicateClient({
	token: env.SYNDICATE_API_KEY,
});

// Factory constants
const FACTORY_ADDRESS = env.SLASH_TIP_FACTORY_ADDRESS;
const ADMIN_ADDRESS = env.ADMIN_ADDRESS;
const CHAIN_ID = 8453; // Base mainnet
const PROJECT_ID = "570119ce-a49c-4245-8851-11c9d1ad74c7";

// Operator addresses (Syndicate relayers that can execute tips, manage users, etc.)
const OPERATOR_ADDRESSES = [
	"0xE7129298AE18FD2f4862E9a25D40CE333b11c583",
	"0x8f9B71d1a895e4Fb4906D3e01F3B39FB983E33e0",
	"0xDd73C6Adea961820981b4e65b514F7D00A195c07",
];

// Viem client for reading from contracts
const publicClient = createPublicClient({
	chain: base,
	transport: http(env.BASE_RPC_URL),
});

export interface OrgAddresses {
	slashTipAddress: string;
	userRegistryAddress: string;
	tipActionAddress: string;
	tipTokenAddress: string;
}

export interface DeploymentResult {
	success: boolean;
	transactionHash?: string;
	error?: string;
}

/**
 * Parse deployed addresses from a deployment transaction receipt
 * Extracts addresses from the OrgDeployed event
 */
export async function getOrgAddressesFromTx(
	txHash: string,
): Promise<OrgAddresses | null> {
	try {
		const receipt = await publicClient.getTransactionReceipt({
			hash: txHash as Hex,
		});

		const logs = parseEventLogs({
			abi: SlashTipFactoryAbi,
			logs: receipt.logs,
			eventName: "OrgDeployed",
		});

		if (logs.length === 0) {
			console.error("No OrgDeployed event found in transaction");
			return null;
		}

		const event = logs[0];
		return {
			slashTipAddress: event.args.slashTip,
			userRegistryAddress: event.args.userRegistry,
			tipActionAddress: event.args.tipAction,
			tipTokenAddress: event.args.tipToken,
		};
	} catch (error) {
		console.error("Failed to parse OrgDeployed event:", error);
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
	vaultManagerAddress: string; // Required: address that can withdraw funds from the vault
}

export interface ETHVaultDeploymentConfig {
	orgId: string;
	vaultManagerAddress: string; // Required: address that can withdraw funds from the vault
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

	console.log("Deploying ERC1155 setup:", config);

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithERC1155(string _orgId, address _admin, address[] _operators, string _tokenBaseURI, string _contractURI, uint256 _tokenId)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_operators: OPERATOR_ADDRESSES,
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

	console.log("Deploying ERC20 setup:", config);

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithERC20(string _orgId, address _admin, address[] _operators, string _tokenName, string _tokenSymbol, uint8 _tokenDecimals)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_operators: OPERATOR_ADDRESSES,
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

	console.log("Deploying ERC20 Vault setup:", {
		orgId: config.orgId,
		admin: ADMIN_ADDRESS,
		vaultManager: config.vaultManagerAddress,
		token: config.tokenAddress,
	});

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithERC20Vault(string _orgId, address _admin, address[] _operators, address _vaultManager, address _token)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_operators: OPERATOR_ADDRESSES,
				_vaultManager: config.vaultManagerAddress,
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

/**
 * Deploy an ETH vault tip setup for an organization (uses native ETH)
 */
export async function deployETHVault(
	config: ETHVaultDeploymentConfig,
): Promise<DeploymentResult> {
	if (!FACTORY_ADDRESS) {
		console.error("SLASH_TIP_FACTORY_ADDRESS not set");
		return { success: false, error: "Factory not configured" };
	}

	console.log("Deploying ETH Vault setup:", {
		orgId: config.orgId,
		admin: ADMIN_ADDRESS,
		vaultManager: config.vaultManagerAddress,
	});

	try {
		const { transactionId } = await syndicate.transact.sendTransaction({
			chainId: CHAIN_ID,
			projectId: PROJECT_ID,
			contractAddress: FACTORY_ADDRESS,
			functionSignature:
				"deployWithETHVault(string _orgId, address _admin, address[] _operators, address _vaultManager)",
			args: {
				_orgId: config.orgId,
				_admin: ADMIN_ADDRESS,
				_operators: OPERATOR_ADDRESSES,
				_vaultManager: config.vaultManagerAddress,
			},
		});

		const hash = await waitForHash(syndicate, {
			projectId: PROJECT_ID,
			transactionId,
			every: 500,
			maxAttempts: 60,
		});

		console.log(`ETH Vault deployment transaction: ${hash}`);

		return {
			success: true,
			transactionHash: hash,
		};
	} catch (error) {
		console.error("ETH Vault deployment failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Deployment failed",
		};
	}
}
