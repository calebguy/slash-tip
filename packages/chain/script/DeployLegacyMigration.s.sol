// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SlashTipFactory} from "../src/contracts/SlashTipFactory.sol";
import {ERC1155MintAction} from "../src/contracts/ERC1155MintAction.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {DeprecatedTip} from "../src/contracts/DeprecatedTip.sol";
import {DeprecatedUserRegistry} from "../src/contracts/DeprecatedUserRegistry.sol";

/// @title DeployLegacyMigration
/// @notice Migrate an existing DeprecatedTip organization to the V2 system
/// @dev This script:
///      1. Deploys new V2 contracts via factory (SlashTip, UserRegistry, ERC1155MintAction)
///      2. Points the action to the existing DeprecatedTip contract
///      3. Grants TIP_MANAGER role on DeprecatedTip to the new action
///
/// Run with:
///   forge script script/DeployLegacyMigration.s.sol:DeployLegacyMigration \
///     --rpc-url $RPC_URL --broadcast --verify
///
/// Required environment variables:
///   DEPLOYER_PRIVATE_KEY - Private key for the deployer (must have DEPLOYER role on factory)
///   FACTORY_ADDRESS - Address of the SlashTipFactory
///   DEPRECATED_TIP_ADDRESS - Address of the existing DeprecatedTip contract
///   ORG_ID - Organization ID for the new deployment
///   ADMIN_ADDRESS - Admin address for the new contracts
///   TOKEN_ID - Token ID used in DeprecatedTip
///
/// Optional environment variables:
///   OPERATOR_ADDRESSES - Comma-separated list of operator addresses (defaults to Syndicate relayers)
contract DeployLegacyMigration is Script {
    // Default operator addresses (Syndicate relayers)
    address constant SYNDICATE_RELAYER_1 = 0xE7129298AE18FD2f4862E9a25D40CE333b11c583;
    address constant SYNDICATE_RELAYER_2 = 0x8f9B71d1a895e4Fb4906D3e01F3B39FB983E33e0;
    address constant SYNDICATE_RELAYER_3 = 0xDd73C6Adea961820981b4e65b514F7D00A195c07;

    function run() external {
        // Load required environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address deprecatedTipAddress = vm.envAddress("DEPRECATED_TIP_ADDRESS");
        string memory orgId = vm.envString("ORG_ID");
        address admin = vm.envAddress("ADMIN_ADDRESS");
        uint256 tokenId = vm.envUint("TOKEN_ID");

        // Load optional operator addresses or use defaults
        address[] memory operators = _getOperators();

        console.log("=== Legacy Migration Configuration ===");
        console.log("Factory:", factoryAddress);
        console.log("DeprecatedTip:", deprecatedTipAddress);
        console.log("Org ID:", orgId);
        console.log("Admin:", admin);
        console.log("Token ID:", tokenId);
        console.log("Operators:");
        for (uint256 i = 0; i < operators.length; i++) {
            console.log("  ", operators[i]);
        }
        console.log("");

        SlashTipFactory factory = SlashTipFactory(factoryAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy via factory
        console.log("--- Step 1: Deploy via Factory ---");
        (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        ) = factory.deployWithERC1155(
            orgId,
            admin,
            operators,
            "",  // baseUri - not used since we're pointing to DeprecatedTip
            "",  // contractUri - not used
            tokenId
        );

        console.log("SlashTip deployed:", slashTip);
        console.log("UserRegistry deployed:", userRegistry);
        console.log("ERC1155MintAction deployed:", tipAction);
        console.log("TipERC1155 deployed (unused):", tipToken);
        console.log("");

        // Step 2: Point action to DeprecatedTip
        console.log("--- Step 2: Point Action to DeprecatedTip ---");
        ERC1155MintAction action = ERC1155MintAction(tipAction);

        address oldToken = address(action.token());
        action.setToken(deprecatedTipAddress);
        console.log("Token updated from", oldToken, "to", deprecatedTipAddress);
        console.log("");

        vm.stopBroadcast();

        // Summary
        console.log("========== DEPLOYMENT SUMMARY ==========");
        console.log("Org ID:", orgId);
        console.log("");
        console.log("New V2 Contracts:");
        console.log("  SlashTip:", slashTip);
        console.log("  UserRegistry:", userRegistry);
        console.log("  ERC1155MintAction:", tipAction);
        console.log("  TipERC1155 (unused):", tipToken);
        console.log("");
        console.log("Legacy Contract (now used by action):");
        console.log("  DeprecatedTip:", deprecatedTipAddress);
        console.log("==========================================");
        console.log("");
        console.log("IMPORTANT: Next steps required:");
        console.log("1. Grant TIP_MANAGER role on DeprecatedTip to the action");
        console.log("   Run: GrantTipManager script with ADMIN_PRIVATE_KEY");
        console.log("");
        console.log("2. Update database:");
        console.log("   UPDATE org_contracts");
        console.log("   SET tip_token_address = '", deprecatedTipAddress, "'");
        console.log("   WHERE org_id = '", orgId, "';");
        console.log("");
        console.log("3. Migrate users from DeprecatedUserRegistry to new UserRegistry");
        console.log("   Run: MigrateUsers script");
    }

    function _getOperators() internal pure returns (address[] memory operators) {
        // Default to Syndicate relayers
        // To customize, modify this function or add environment variable parsing
        operators = new address[](3);
        operators[0] = SYNDICATE_RELAYER_1;
        operators[1] = SYNDICATE_RELAYER_2;
        operators[2] = SYNDICATE_RELAYER_3;
        return operators;
    }
}

/// @title GrantTipManager
/// @notice Grant TIP_MANAGER role on DeprecatedTip to the ERC1155MintAction
/// @dev This must be run by an account with DEFAULT_ADMIN_ROLE on DeprecatedTip
///
/// Run with:
///   forge script script/DeployLegacyMigration.s.sol:GrantTipManager \
///     --rpc-url $RPC_URL --broadcast
///
/// Required environment variables:
///   ADMIN_PRIVATE_KEY - Private key for the admin (must have DEFAULT_ADMIN_ROLE on DeprecatedTip)
///   DEPRECATED_TIP_ADDRESS - Address of the DeprecatedTip contract
///   TIP_ACTION_ADDRESS - Address of the ERC1155MintAction to grant role to
contract GrantTipManager is Script {
    function run() external {
        uint256 adminPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address deprecatedTipAddress = vm.envAddress("DEPRECATED_TIP_ADDRESS");
        address tipActionAddress = vm.envAddress("TIP_ACTION_ADDRESS");

        console.log("=== Grant TIP_MANAGER Role ===");
        console.log("DeprecatedTip:", deprecatedTipAddress);
        console.log("TipAction:", tipActionAddress);

        DeprecatedTip deprecatedTip = DeprecatedTip(deprecatedTipAddress);
        bytes32 TIP_MANAGER = keccak256("TIP_MANAGER");

        // Check current role status
        bool hasRole = deprecatedTip.hasRole(TIP_MANAGER, tipActionAddress);
        console.log("Action already has TIP_MANAGER:", hasRole);

        if (hasRole) {
            console.log("Role already granted, nothing to do");
            return;
        }

        vm.startBroadcast(adminPrivateKey);

        deprecatedTip.grantRole(TIP_MANAGER, tipActionAddress);

        vm.stopBroadcast();

        // Verify
        hasRole = deprecatedTip.hasRole(TIP_MANAGER, tipActionAddress);
        console.log("");
        console.log("========== ROLE GRANTED ==========");
        console.log("TIP_MANAGER granted to action:", hasRole);
        console.log("===================================");
    }
}

/// @title MigrateUsers
/// @notice Migrate users from DeprecatedUserRegistry to the new UserRegistry
/// @dev This must be run by an account with USER_MANAGER role on the new UserRegistry
///
/// Run with:
///   forge script script/DeployLegacyMigration.s.sol:MigrateUsers \
///     --rpc-url $RPC_URL --broadcast
///
/// Required environment variables:
///   OPERATOR_PRIVATE_KEY - Private key for the operator (must have USER_MANAGER role)
///   DEPRECATED_USER_REGISTRY_ADDRESS - Address of the old DeprecatedUserRegistry
///   NEW_USER_REGISTRY_ADDRESS - Address of the new UserRegistry
contract MigrateUsers is Script {
    function run() external {
        uint256 operatorPrivateKey = vm.envUint("OPERATOR_PRIVATE_KEY");
        address deprecatedUserRegistryAddress = vm.envAddress("DEPRECATED_USER_REGISTRY_ADDRESS");
        address newUserRegistryAddress = vm.envAddress("NEW_USER_REGISTRY_ADDRESS");

        console.log("=== Migrate Users ===");
        console.log("From DeprecatedUserRegistry:", deprecatedUserRegistryAddress);
        console.log("To UserRegistry:", newUserRegistryAddress);

        DeprecatedUserRegistry oldRegistry = DeprecatedUserRegistry(deprecatedUserRegistryAddress);
        UserRegistry newRegistry = UserRegistry(newUserRegistryAddress);

        // Get all users from old registry
        DeprecatedUserRegistry.User[] memory oldUsers = oldRegistry.listUsers();
        console.log("Found", oldUsers.length, "users to migrate");

        if (oldUsers.length == 0) {
            console.log("No users to migrate");
            return;
        }

        vm.startBroadcast(operatorPrivateKey);

        uint256 migrated = 0;
        uint256 skipped = 0;

        for (uint256 i = 0; i < oldUsers.length; i++) {
            DeprecatedUserRegistry.User memory oldUser = oldUsers[i];

            // Check if user already exists in new registry
            if (newRegistry.userExists(oldUser.id)) {
                console.log("  Skipping (already exists):", oldUser.id);
                skipped++;
                continue;
            }

            // Create new user struct (allowance now managed off-chain)
            UserRegistry.User memory newUser = UserRegistry.User({
                id: oldUser.id,
                nickname: oldUser.nickname,
                account: oldUser.account
            });

            newRegistry.addUser(oldUser.id, newUser);
            console.log("  Migrated:", oldUser.id, "->", oldUser.nickname);
            migrated++;
        }

        vm.stopBroadcast();

        console.log("");
        console.log("========== MIGRATION COMPLETE ==========");
        console.log("Total users:", oldUsers.length);
        console.log("Migrated:", migrated);
        console.log("Skipped (already existed):", skipped);
        console.log("=========================================");
    }
}

/// @title VerifyMigration
/// @notice Verify that the migration was successful
/// @dev This is a read-only script that checks all the role configurations
///
/// Run with:
///   forge script script/DeployLegacyMigration.s.sol:VerifyMigration \
///     --rpc-url $RPC_URL
///
/// Required environment variables:
///   USER_REGISTRY_ADDRESS - Address of the deployed UserRegistry
///   TIP_ACTION_ADDRESS - Address of the deployed ERC1155MintAction
///   DEPRECATED_TIP_ADDRESS - Address of the DeprecatedTip
contract VerifyMigration is Script {
    function run() external view {
        address userRegistryAddress = vm.envAddress("USER_REGISTRY_ADDRESS");
        address tipActionAddress = vm.envAddress("TIP_ACTION_ADDRESS");
        address deprecatedTipAddress = vm.envAddress("DEPRECATED_TIP_ADDRESS");

        console.log("=== Verify Migration ===");
        console.log("");

        // Check ERC1155MintAction configuration
        ERC1155MintAction action = ERC1155MintAction(tipActionAddress);
        address tokenAddress = address(action.token());
        uint256 tokenId = action.tokenId();

        console.log("ERC1155MintAction:");
        console.log("  Token address:", tokenAddress);
        console.log("  Token ID:", tokenId);
        console.log("  Points to DeprecatedTip:", tokenAddress == deprecatedTipAddress);
        console.log("");

        // Check roles on DeprecatedTip
        DeprecatedTip deprecatedTip = DeprecatedTip(deprecatedTipAddress);
        bytes32 TIP_MANAGER = keccak256("TIP_MANAGER");
        bool actionHasTipManager = deprecatedTip.hasRole(TIP_MANAGER, tipActionAddress);

        console.log("DeprecatedTip Roles:");
        console.log("  Action has TIP_MANAGER:", actionHasTipManager);
        console.log("");

        // Check UserRegistry
        UserRegistry userRegistry = UserRegistry(userRegistryAddress);
        uint256 userCount = userRegistry.userCount();

        console.log("UserRegistry:");
        console.log("  User count:", userCount);
        console.log("  Org ID:", userRegistry.orgId());
        console.log("");

        // Summary
        console.log("========== VERIFICATION SUMMARY ==========");
        if (tokenAddress == deprecatedTipAddress && actionHasTipManager) {
            console.log("Status: READY");
            console.log("The migration is complete and ready for use.");
        } else {
            console.log("Status: INCOMPLETE");
            if (tokenAddress != deprecatedTipAddress) {
                console.log("  - Action token not pointing to DeprecatedTip");
            }
            if (!actionHasTipManager) {
                console.log("  - Action missing TIP_MANAGER role on DeprecatedTip");
            }
        }
        console.log("==========================================");
    }
}
