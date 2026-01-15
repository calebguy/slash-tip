// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {TipERC1155} from "../src/contracts/TipERC1155.sol";
import {TipERC20} from "../src/contracts/TipERC20.sol";
import {ERC1155MintAction} from "../src/contracts/ERC1155MintAction.sol";
import {ERC20MintAction} from "../src/contracts/ERC20MintAction.sol";
import {ERC20VaultAction} from "../src/contracts/ERC20VaultAction.sol";
import {ETHVaultAction} from "../src/contracts/ETHVaultAction.sol";
import {SlashTipFactory} from "../src/contracts/SlashTipFactory.sol";

/// @title DeploySlashTip
/// @notice Deployment script for SlashTip contracts using Beacon Proxy pattern
/// @dev Run with: forge script script/DeployV2.s.sol:DeploySlashTip --rpc-url $RPC_URL --broadcast --verify
contract DeploySlashTip is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.envAddress("ADMIN_ADDRESS");

        console.log("Deploying SlashTip contracts...");
        console.log("Admin address:", admin);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy implementation contracts (these are templates, not initialized)
        console.log("\n--- Deploying Implementation Contracts ---");

        SlashTip slashTipImpl = new SlashTip();
        console.log("SlashTip implementation:", address(slashTipImpl));

        UserRegistry userRegistryImpl = new UserRegistry();
        console.log("UserRegistry implementation:", address(userRegistryImpl));

        TipERC1155 tipERC1155Impl = new TipERC1155();
        console.log("TipERC1155 implementation:", address(tipERC1155Impl));

        TipERC20 tipERC20Impl = new TipERC20();
        console.log("TipERC20 implementation:", address(tipERC20Impl));

        ERC1155MintAction erc1155MintActionImpl = new ERC1155MintAction();
        console.log("ERC1155MintAction implementation:", address(erc1155MintActionImpl));

        ERC20MintAction erc20MintActionImpl = new ERC20MintAction();
        console.log("ERC20MintAction implementation:", address(erc20MintActionImpl));

        ERC20VaultAction erc20VaultActionImpl = new ERC20VaultAction();
        console.log("ERC20VaultAction implementation:", address(erc20VaultActionImpl));

        ETHVaultAction ethVaultActionImpl = new ETHVaultAction();
        console.log("ETHVaultAction implementation:", address(ethVaultActionImpl));

        // 2. Deploy factory with all implementation addresses
        console.log("\n--- Deploying Factory ---");

        SlashTipFactory factory = new SlashTipFactory(
            admin,
            address(slashTipImpl),
            address(userRegistryImpl),
            address(tipERC1155Impl),
            address(tipERC20Impl),
            address(erc1155MintActionImpl),
            address(erc20MintActionImpl),
            address(erc20VaultActionImpl),
            address(ethVaultActionImpl)
        );
        console.log("SlashTipFactory:", address(factory));

        vm.stopBroadcast();

        // Log summary
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("Admin:", admin);
        console.log("\nImplementations:");
        console.log("  SlashTip:", address(slashTipImpl));
        console.log("  UserRegistry:", address(userRegistryImpl));
        console.log("  TipERC1155:", address(tipERC1155Impl));
        console.log("  TipERC20:", address(tipERC20Impl));
        console.log("  ERC1155MintAction:", address(erc1155MintActionImpl));
        console.log("  ERC20MintAction:", address(erc20MintActionImpl));
        console.log("  ERC20VaultAction:", address(erc20VaultActionImpl));
        console.log("  ETHVaultAction:", address(ethVaultActionImpl));
        console.log("\nFactory:", address(factory));
        console.log("==========================================");
    }
}

/// @title RedeployFactory
/// @notice Redeploy just the factory using existing implementation addresses
/// @dev Run with: forge script script/DeployFactory.s.sol:RedeployFactory --rpc-url $RPC_URL --broadcast --verify
contract RedeployFactory is Script {
    // Existing implementation addresses on Base Mainnet
    address constant SLASH_TIP_IMPL = 0x20951a1BF3dC958F78912D72D0919DdaD11A8b5d;
    address constant USER_REGISTRY_IMPL = 0xD9A1843BcF0D6283b1f8e213Eb3baecFC79914f4;
    address constant TIP_ERC1155_IMPL = 0x3c64970A0ADDFa2F29a717bd2c8e11452654F725;
    address constant TIP_ERC20_IMPL = 0x4fE83003fA7b5967b69FAFc96124885b4477E830;
    address constant ERC1155_MINT_ACTION_IMPL = 0x812341337c3a8D5cF04DA58970fFbABBea1b182e;
    address constant ERC20_MINT_ACTION_IMPL = 0xD96f1C315Daa52C15F9494159ac02F1820e4fA69;
    address constant ERC20_VAULT_ACTION_IMPL = 0xe1A481e129d6aA7562b89452C75C84439d5b535F;
    address constant ETH_VAULT_ACTION_IMPL = 0x4f5422Ab6151bA60593F38505ee95a01343F7E48;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.envAddress("ADMIN_ADDRESS");

        console.log("Redeploying factory with existing implementations...");
        console.log("Admin address:", admin);

        vm.startBroadcast(deployerPrivateKey);

        SlashTipFactory factory = new SlashTipFactory(
            admin,
            SLASH_TIP_IMPL,
            USER_REGISTRY_IMPL,
            TIP_ERC1155_IMPL,
            TIP_ERC20_IMPL,
            ERC1155_MINT_ACTION_IMPL,
            ERC20_MINT_ACTION_IMPL,
            ERC20_VAULT_ACTION_IMPL,
            ETH_VAULT_ACTION_IMPL
        );

        vm.stopBroadcast();

        console.log("\n========== FACTORY REDEPLOYMENT ==========");
        console.log("New SlashTipFactory:", address(factory));
        console.log("");
        console.log("Using existing implementations:");
        console.log("  SlashTip:", SLASH_TIP_IMPL);
        console.log("  UserRegistry:", USER_REGISTRY_IMPL);
        console.log("  TipERC1155:", TIP_ERC1155_IMPL);
        console.log("  TipERC20:", TIP_ERC20_IMPL);
        console.log("  ERC1155MintAction:", ERC1155_MINT_ACTION_IMPL);
        console.log("  ERC20MintAction:", ERC20_MINT_ACTION_IMPL);
        console.log("  ERC20VaultAction:", ERC20_VAULT_ACTION_IMPL);
        console.log("  ETHVaultAction:", ETH_VAULT_ACTION_IMPL);
        console.log("==========================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update SLASH_TIP_FACTORY_ADDRESS in your server .env");
        console.log("2. Update SLASH_TIP_FACTORY_START_BLOCK in constants.ts");
    }
}

/// @title DeployOrg
/// @notice Deploy a new organization using the factory
/// @dev Run with: forge script script/DeployV2.s.sol:DeployOrg --rpc-url $RPC_URL --broadcast
contract DeployOrg is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address factory = vm.envAddress("FACTORY_ADDRESS");
        address orgAdmin = vm.envAddress("ORG_ADMIN_ADDRESS");
        string memory orgId = vm.envString("ORG_ID");
        string memory deploymentType = vm.envString("DEPLOYMENT_TYPE"); // "erc1155", "erc20", "erc20vault", or "ethvault"

        // Parse operator addresses (comma-separated)
        address[] memory operators = vm.envAddress("OPERATOR_ADDRESSES", ",");
        require(operators.length > 0, "At least one operator address required");

        console.log("Deploying org:", orgId);
        console.log("Deployment type:", deploymentType);
        console.log("Org admin:", orgAdmin);
        console.log("Operators count:", operators.length);
        for (uint i = 0; i < operators.length; i++) {
            console.log("  Operator", i, ":", operators[i]);
        }

        vm.startBroadcast(deployerPrivateKey);

        SlashTipFactory f = SlashTipFactory(factory);

        if (keccak256(bytes(deploymentType)) == keccak256(bytes("erc1155"))) {
            string memory baseUri = vm.envOr("TOKEN_BASE_URI", string(""));
            string memory contractUri = vm.envOr("CONTRACT_URI", string(""));
            uint256 tokenId = vm.envOr("TOKEN_ID", uint256(0));

            (address slashTip, address userRegistry, address tipAction, address tipToken) =
                f.deployWithERC1155(orgId, orgAdmin, operators, baseUri, contractUri, tokenId);

            console.log("\n--- ERC1155 Deployment ---");
            console.log("SlashTip:", slashTip);
            console.log("UserRegistry:", userRegistry);
            console.log("TipAction:", tipAction);
            console.log("TipToken:", tipToken);

        } else if (keccak256(bytes(deploymentType)) == keccak256(bytes("erc20"))) {
            string memory tokenName = vm.envString("TOKEN_NAME");
            string memory tokenSymbol = vm.envString("TOKEN_SYMBOL");
            uint8 tokenDecimals = uint8(vm.envOr("TOKEN_DECIMALS", uint256(18)));

            (address slashTip, address userRegistry, address tipAction, address tipToken) =
                f.deployWithERC20(orgId, orgAdmin, operators, tokenName, tokenSymbol, tokenDecimals);

            console.log("\n--- ERC20 Deployment ---");
            console.log("SlashTip:", slashTip);
            console.log("UserRegistry:", userRegistry);
            console.log("TipAction:", tipAction);
            console.log("TipToken:", tipToken);

        } else if (keccak256(bytes(deploymentType)) == keccak256(bytes("erc20vault"))) {
            address existingToken = vm.envAddress("EXISTING_TOKEN_ADDRESS");
            address vaultManager = vm.envAddress("VAULT_MANAGER_ADDRESS");

            (address slashTip, address userRegistry, address tipAction) =
                f.deployWithERC20Vault(orgId, orgAdmin, operators, vaultManager, existingToken);

            console.log("\n--- ERC20 Vault Deployment ---");
            console.log("SlashTip:", slashTip);
            console.log("UserRegistry:", userRegistry);
            console.log("TipAction (Vault):", tipAction);
            console.log("Existing Token:", existingToken);
            console.log("Vault Manager:", vaultManager);

        } else if (keccak256(bytes(deploymentType)) == keccak256(bytes("ethvault"))) {
            address vaultManager = vm.envAddress("VAULT_MANAGER_ADDRESS");

            (address slashTip, address userRegistry, address tipAction) =
                f.deployWithETHVault(orgId, orgAdmin, operators, vaultManager);

            console.log("\n--- ETH Vault Deployment ---");
            console.log("SlashTip:", slashTip);
            console.log("UserRegistry:", userRegistry);
            console.log("TipAction (ETH Vault):", tipAction);
            console.log("Fund the vault by sending ETH to:", tipAction);
            console.log("Vault Manager:", vaultManager);

        } else {
            revert("Invalid DEPLOYMENT_TYPE. Use: erc1155, erc20, erc20vault, or ethvault");
        }

        vm.stopBroadcast();
    }
}
