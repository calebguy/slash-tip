// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SlashTip} from "../src/contracts/v2/SlashTip.sol";
import {UserRegistry} from "../src/contracts/v2/UserRegistry.sol";
import {TipERC1155} from "../src/contracts/v2/TipERC1155.sol";
import {TipERC20} from "../src/contracts/v2/TipERC20.sol";
import {ERC1155MintAction} from "../src/contracts/v2/ERC1155MintAction.sol";
import {ERC20MintAction} from "../src/contracts/v2/ERC20MintAction.sol";
import {ERC20VaultAction} from "../src/contracts/v2/ERC20VaultAction.sol";
import {SlashTipFactory} from "../src/contracts/v2/SlashTipFactory.sol";

/// @title DeployV2
/// @notice Deployment script for SlashTip V2 contracts using Beacon Proxy pattern
/// @dev Run with: forge script script/DeployV2.s.sol:DeployV2 --rpc-url $RPC_URL --broadcast --verify
contract DeployV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.envAddress("ADMIN_ADDRESS");

        console.log("Deploying V2 contracts...");
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
            address(erc20VaultActionImpl)
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
        console.log("\nFactory:", address(factory));
        console.log("==========================================");
    }
}

/// @title RedeployFactory
/// @notice Redeploy just the factory using existing implementation addresses
/// @dev Run with: forge script script/DeployV2.s.sol:RedeployFactory --rpc-url $RPC_URL --broadcast --verify
contract RedeployFactory is Script {
    // Existing implementation addresses on Base Mainnet
    address constant SLASH_TIP_IMPL = 0xAF9F2C21a085712535e28c070629382Ae4F31534;
    address constant USER_REGISTRY_IMPL = 0xB765639c781e92B20754E9ee9B749941A6d8d30f;
    address constant TIP_ERC1155_IMPL = 0xFaed9eCde814329026dC6258674a98040A1e8903;
    address constant TIP_ERC20_IMPL = 0xaCf41658F6Ca80021D64ff5044fC2A8F7543C1C3;
    address constant ERC1155_MINT_ACTION_IMPL = 0x57D46C53A522901235e9F59C44b38A79b7C883F8;
    address constant ERC20_MINT_ACTION_IMPL = 0xAC7F5dE17761e03D59D710b0396894f2eA2E7942;
    address constant ERC20_VAULT_ACTION_IMPL = 0x4FA419c7AfBD180D6aCC9E023Ea5bb6d5D7385A9;

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
            ERC20_VAULT_ACTION_IMPL
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
        console.log("==========================================");
        console.log("");
        console.log("Next steps:");
        console.log("1. Update SLASH_TIP_FACTORY_ADDRESS in your server .env");
        console.log("2. The old factory at 0x1b7f53A1f5D2951275b6e3E1cb6Ad06333c8459F can be abandoned");
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
        string memory deploymentType = vm.envString("DEPLOYMENT_TYPE"); // "erc1155", "erc20", or "erc20vault"

        console.log("Deploying org:", orgId);
        console.log("Deployment type:", deploymentType);
        console.log("Org admin:", orgAdmin);

        vm.startBroadcast(deployerPrivateKey);

        SlashTipFactory f = SlashTipFactory(factory);

        if (keccak256(bytes(deploymentType)) == keccak256(bytes("erc1155"))) {
            string memory baseUri = vm.envOr("TOKEN_BASE_URI", string(""));
            string memory contractUri = vm.envOr("CONTRACT_URI", string(""));
            uint256 tokenId = vm.envOr("TOKEN_ID", uint256(0));

            (address slashTip, address userRegistry, address tipAction, address tipToken) =
                f.deployWithERC1155(orgId, orgAdmin, baseUri, contractUri, tokenId);

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
                f.deployWithERC20(orgId, orgAdmin, tokenName, tokenSymbol, tokenDecimals);

            console.log("\n--- ERC20 Deployment ---");
            console.log("SlashTip:", slashTip);
            console.log("UserRegistry:", userRegistry);
            console.log("TipAction:", tipAction);
            console.log("TipToken:", tipToken);

        } else if (keccak256(bytes(deploymentType)) == keccak256(bytes("erc20vault"))) {
            address existingToken = vm.envAddress("EXISTING_TOKEN_ADDRESS");

            (address slashTip, address userRegistry, address tipAction) =
                f.deployWithERC20Vault(orgId, orgAdmin, existingToken);

            console.log("\n--- ERC20 Vault Deployment ---");
            console.log("SlashTip:", slashTip);
            console.log("UserRegistry:", userRegistry);
            console.log("TipAction (Vault):", tipAction);
            console.log("Existing Token:", existingToken);

        } else {
            revert("Invalid DEPLOYMENT_TYPE. Use: erc1155, erc20, or erc20vault");
        }

        vm.stopBroadcast();
    }
}
