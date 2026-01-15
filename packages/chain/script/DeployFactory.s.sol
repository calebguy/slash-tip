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

        // Hardcoded deployer addresses (Syndicate relayers)
        address[] memory deployers = new address[](3);
        deployers[0] = 0xE7129298AE18FD2f4862E9a25D40CE333b11c583;
        deployers[1] = 0x8f9B71d1a895e4Fb4906D3e01F3B39FB983E33e0;
        deployers[2] = 0xDd73C6Adea961820981b4e65b514F7D00A195c07;

        console.log("Deploying SlashTip contracts...");
        console.log("Admin address:", admin);
        console.log("Deployers:");
        console.log("  Deployer 0:", deployers[0]);
        console.log("  Deployer 1:", deployers[1]);
        console.log("  Deployer 2:", deployers[2]);

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
            deployers,
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
contract DeployFactory is Script {
    // Existing implementation addresses on Base Mainnet
    address constant SLASH_TIP_IMPL = 0x8c92aD60EF9e8f3E6DaF8b4649b310ca09d26A5d;
    address constant USER_REGISTRY_IMPL = 0x4035d0E432bfD35a603c296F2052a42044e2306c;
    address constant TIP_ERC1155_IMPL = 0x8E53CE2fC7Ae2053b5c2Aa8A09E3645F61f689d5;
    address constant TIP_ERC20_IMPL = 0xB523B0C2547A982D770fE6c4c7F22A016921ADe2;
    address constant ERC1155_MINT_ACTION_IMPL = 0x5cF2b7Db45634643160EA8cc74Ce5023826FbB63;
    address constant ERC20_MINT_ACTION_IMPL = 0x89d0A0c19CFc0089320cA53DeA85df9Bd0DAA8d6;
    address constant ERC20_VAULT_ACTION_IMPL = 0x64AeCC54738159fee816390b011eCb4c54461528;
    address constant ETH_VAULT_ACTION_IMPL = 0xdE7fdADc2a1409a32e95521D611C86F607405f2D;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address admin = vm.envAddress("ADMIN_ADDRESS");

        // Hardcoded deployer addresses (Syndicate relayers)
        address[] memory deployers = new address[](3);
        deployers[0] = 0xE7129298AE18FD2f4862E9a25D40CE333b11c583;
        deployers[1] = 0x8f9B71d1a895e4Fb4906D3e01F3B39FB983E33e0;
        deployers[2] = 0xDd73C6Adea961820981b4e65b514F7D00A195c07;

        console.log("Redeploying factory with existing implementations...");
        console.log("Admin address:", admin);
        console.log("Deployers:");
        console.log("  Deployer 0:", deployers[0]);
        console.log("  Deployer 1:", deployers[1]);
        console.log("  Deployer 2:", deployers[2]);

        vm.startBroadcast(deployerPrivateKey);

        SlashTipFactory factory = new SlashTipFactory(
            admin,
            deployers,
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
        console.log("Deployers with DEPLOYER role:");
        console.log("  ", deployers[0]);
        console.log("  ", deployers[1]);
        console.log("  ", deployers[2]);
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

