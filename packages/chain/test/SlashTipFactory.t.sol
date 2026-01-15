// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {SlashTipFactory} from "../src/contracts/SlashTipFactory.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {TipERC1155} from "../src/contracts/TipERC1155.sol";
import {TipERC20} from "../src/contracts/TipERC20.sol";
import {ERC1155MintAction} from "../src/contracts/ERC1155MintAction.sol";
import {ERC20MintAction} from "../src/contracts/ERC20MintAction.sol";
import {ERC20VaultAction} from "../src/contracts/ERC20VaultAction.sol";
import {ETHVaultAction} from "../src/contracts/ETHVaultAction.sol";
import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";

/// @notice Mock ERC20 for testing vault deployments
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @notice Tests for SlashTipFactory
contract SlashTipFactoryTest is Test {
    SlashTipFactory public factory;
    address public admin = address(this);
    address public operator1 = address(0xAA01);
    address public operator2 = address(0xAA02);

    // Implementation addresses
    SlashTip public slashTipImpl;
    UserRegistry public userRegistryImpl;
    TipERC1155 public tipERC1155Impl;
    TipERC20 public tipERC20Impl;
    ERC1155MintAction public erc1155MintActionImpl;
    ERC20MintAction public erc20MintActionImpl;
    ERC20VaultAction public erc20VaultActionImpl;
    ETHVaultAction public ethVaultActionImpl;

    function setUp() public {
        // Deploy implementations
        slashTipImpl = new SlashTip();
        userRegistryImpl = new UserRegistry();
        tipERC1155Impl = new TipERC1155();
        tipERC20Impl = new TipERC20();
        erc1155MintActionImpl = new ERC1155MintAction();
        erc20MintActionImpl = new ERC20MintAction();
        erc20VaultActionImpl = new ERC20VaultAction();
        ethVaultActionImpl = new ETHVaultAction();

        // Deploy factory
        factory = new SlashTipFactory(
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
    }

    function _operators() internal view returns (address[] memory) {
        address[] memory ops = new address[](1);
        ops[0] = operator1;
        return ops;
    }

    function _multipleOperators() internal view returns (address[] memory) {
        address[] memory ops = new address[](2);
        ops[0] = operator1;
        ops[1] = operator2;
        return ops;
    }

    function test_constructor() public view {
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_getBeacons() public view {
        (
            address slashTipBeacon,
            address userRegistryBeacon,
            address tipERC1155Beacon,
            address tipERC20Beacon,
            address erc1155MintActionBeacon,
            address erc20MintActionBeacon,
            address erc20VaultActionBeacon,
            address ethVaultActionBeacon
        ) = factory.getBeacons();

        assertTrue(slashTipBeacon != address(0));
        assertTrue(userRegistryBeacon != address(0));
        assertTrue(tipERC1155Beacon != address(0));
        assertTrue(tipERC20Beacon != address(0));
        assertTrue(erc1155MintActionBeacon != address(0));
        assertTrue(erc20MintActionBeacon != address(0));
        assertTrue(erc20VaultActionBeacon != address(0));
        assertTrue(ethVaultActionBeacon != address(0));
    }

    function test_getImplementations() public view {
        (
            address slashTip,
            address userRegistry,
            address tipERC1155,
            address tipERC20,
            address erc1155MintAction,
            address erc20MintAction,
            address erc20VaultAction,
            address ethVaultAction
        ) = factory.getImplementations();

        assertEq(slashTip, address(slashTipImpl));
        assertEq(userRegistry, address(userRegistryImpl));
        assertEq(tipERC1155, address(tipERC1155Impl));
        assertEq(tipERC20, address(tipERC20Impl));
        assertEq(erc1155MintAction, address(erc1155MintActionImpl));
        assertEq(erc20MintAction, address(erc20MintActionImpl));
        assertEq(erc20VaultAction, address(erc20VaultActionImpl));
        assertEq(ethVaultAction, address(ethVaultActionImpl));
    }

    function test_getImplementations_matchesBeacons() public view {
        (
            address slashTip,
            address userRegistry,
            address tipERC1155,
            address tipERC20,
            address erc1155MintAction,
            address erc20MintAction,
            address erc20VaultAction,
            address ethVaultAction
        ) = factory.getImplementations();

        // Verify each implementation matches the beacon's implementation
        assertEq(slashTip, factory.slashTipBeacon().implementation());
        assertEq(userRegistry, factory.userRegistryBeacon().implementation());
        assertEq(tipERC1155, factory.tipERC1155Beacon().implementation());
        assertEq(tipERC20, factory.tipERC20Beacon().implementation());
        assertEq(erc1155MintAction, factory.erc1155MintActionBeacon().implementation());
        assertEq(erc20MintAction, factory.erc20MintActionBeacon().implementation());
        assertEq(erc20VaultAction, factory.erc20VaultActionBeacon().implementation());
        assertEq(ethVaultAction, factory.ethVaultActionBeacon().implementation());
    }

    function test_deployWithERC1155() public {
        string memory orgId = "test-org-1";
        address orgAdmin = address(0x1111);
        string memory baseURI = "https://example.com/tokens/";
        string memory contractURI = "https://example.com/collection.json";
        uint256 tokenId = 1;

        (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        ) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), baseURI, contractURI, tokenId);

        // Verify contracts deployed
        assertTrue(slashTip != address(0));
        assertTrue(userRegistry != address(0));
        assertTrue(tipAction != address(0));
        assertTrue(tipToken != address(0));

        // Verify SlashTip configuration
        SlashTip st = SlashTip(slashTip);
        assertEq(st.orgId(), orgId);
        assertEq(address(st.userRegistry()), userRegistry);
        assertEq(address(st.tipAction()), tipAction);

        // Verify org admin has correct roles
        assertTrue(st.hasRole(st.DEFAULT_ADMIN_ROLE(), orgAdmin));
        // Verify operator has OPERATOR role
        assertTrue(st.hasRole(st.TIPPER(), operator1));

        // Verify UserRegistry
        UserRegistry ur = UserRegistry(userRegistry);
        assertEq(ur.orgId(), orgId);
        assertTrue(ur.hasRole(ur.DEFAULT_ADMIN_ROLE(), orgAdmin));
        assertTrue(ur.hasRole(ur.USER_MANAGER(), operator1));
    }

    function test_deployWithERC1155_emitsEvent() public {
        string memory orgId = "test-org-2";
        address orgAdmin = address(0x2222);

        vm.expectEmit(true, true, false, false);
        emit SlashTipFactory.OrgDeployed(
            orgId,
            orgId,
            orgAdmin,
            address(0), // We don't know the exact addresses beforehand
            address(0),
            address(0),
            address(0)
        );
        factory.deployWithERC1155(orgId, orgAdmin, _operators(), "", "", 0);
    }

    function test_deployWithERC20() public {
        string memory orgId = "test-org-3";
        address orgAdmin = address(0x3333);
        string memory tokenName = "Tip Token";
        string memory tokenSymbol = "TIP";
        uint8 decimals = 18;

        (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        ) = factory.deployWithERC20(orgId, orgAdmin, _operators(), tokenName, tokenSymbol, decimals);

        // Verify contracts deployed
        assertTrue(slashTip != address(0));
        assertTrue(userRegistry != address(0));
        assertTrue(tipAction != address(0));
        assertTrue(tipToken != address(0));

        // Verify TipERC20 configuration
        TipERC20 token = TipERC20(tipToken);
        assertEq(token.name(), tokenName);
        assertEq(token.symbol(), tokenSymbol);
        assertEq(token.decimals(), decimals);

        // Verify operator has OPERATOR role
        SlashTip st = SlashTip(slashTip);
        assertTrue(st.hasRole(st.TIPPER(), operator1));
    }

    function test_deployWithERC20Vault() public {
        string memory orgId = "test-org-4";
        address orgAdmin = address(0x4444);
        address vaultManager = address(0x4445);

        // Deploy mock ERC20
        MockERC20 existingToken = new MockERC20();

        (
            address slashTip,
            address userRegistry,
            address tipAction
        ) = factory.deployWithERC20Vault(orgId, orgAdmin, _operators(), vaultManager, address(existingToken));

        // Verify contracts deployed
        assertTrue(slashTip != address(0));
        assertTrue(userRegistry != address(0));
        assertTrue(tipAction != address(0));

        // Verify vault configuration
        ERC20VaultAction vault = ERC20VaultAction(tipAction);
        assertEq(address(vault.token()), address(existingToken));

        // Verify vaultManager has VAULT_MANAGER role
        assertTrue(vault.hasRole(vault.VAULT_MANAGER(), vaultManager));
        // Verify orgAdmin does NOT have VAULT_MANAGER role
        assertFalse(vault.hasRole(vault.VAULT_MANAGER(), orgAdmin));
        // Verify SlashTip has TIP_EXECUTOR role
        assertTrue(vault.hasRole(vault.EXECUTOR(), slashTip));

        // Verify operator has OPERATOR role
        SlashTip st = SlashTip(slashTip);
        assertTrue(st.hasRole(st.TIPPER(), operator1));
    }

    function test_deployWithETHVault() public {
        string memory orgId = "test-org-5";
        address orgAdmin = address(0x5555);
        address vaultManager = address(0x5556);

        (
            address slashTip,
            address userRegistry,
            address tipAction
        ) = factory.deployWithETHVault(orgId, orgAdmin, _operators(), vaultManager);

        // Verify contracts deployed
        assertTrue(slashTip != address(0));
        assertTrue(userRegistry != address(0));
        assertTrue(tipAction != address(0));

        // Verify vault works
        ETHVaultAction vault = ETHVaultAction(payable(tipAction));
        assertEq(vault.vaultBalance(), 0);

        // Verify vaultManager has VAULT_MANAGER role
        assertTrue(vault.hasRole(vault.VAULT_MANAGER(), vaultManager));
        // Verify orgAdmin does NOT have VAULT_MANAGER role
        assertFalse(vault.hasRole(vault.VAULT_MANAGER(), orgAdmin));
        // Verify SlashTip has TIP_EXECUTOR role
        assertTrue(vault.hasRole(vault.EXECUTOR(), slashTip));

        // Verify operator has OPERATOR role
        SlashTip st = SlashTip(slashTip);
        assertTrue(st.hasRole(st.TIPPER(), operator1));
    }

    function test_createERC1155Action() public {
        // First deploy an org
        string memory orgId = "action-test-org";
        address orgAdmin = address(0x6666);
        (address slashTip,,,) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), "", "", 0);

        // Create a new ERC1155 action (as factory manager)
        (address newAction, address newToken) = factory.createERC1155Action(
            slashTip,
            orgAdmin,
            _operators(),
            "https://new.example.com/",
            "",
            2
        );

        assertTrue(newAction != address(0));
        assertTrue(newToken != address(0));

        // Verify operator has CONFIG_MANAGER role on new action
        ERC1155MintAction action = ERC1155MintAction(newAction);
        assertTrue(action.hasRole(action.CONFIG_MANAGER(), operator1));
    }

    function test_createERC20Action() public {
        // First deploy an org
        string memory orgId = "action-test-org-2";
        address orgAdmin = address(0x7777);
        (address slashTip,,,) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), "", "", 0);

        // Create a new ERC20 action (as factory manager)
        (address newAction, address newToken) = factory.createERC20Action(
            slashTip,
            orgAdmin,
            _operators(),
            "New Tip",
            "NEWTIP",
            18
        );

        assertTrue(newAction != address(0));
        assertTrue(newToken != address(0));

        TipERC20 token = TipERC20(newToken);
        assertEq(token.name(), "New Tip");

        // Verify operator has CONFIG_MANAGER role on new action
        ERC20MintAction action = ERC20MintAction(newAction);
        assertTrue(action.hasRole(action.CONFIG_MANAGER(), operator1));
    }

    function test_createERC20VaultAction() public {
        // First deploy an org
        string memory orgId = "action-test-org-3";
        address orgAdmin = address(0x8888);
        address vaultManager = address(0x8889);
        (address slashTip,,,) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), "", "", 0);

        // Deploy mock token
        MockERC20 existingToken = new MockERC20();

        // Create a new vault action (as factory manager)
        address newAction = factory.createERC20VaultAction(slashTip, orgAdmin, vaultManager, address(existingToken));

        assertTrue(newAction != address(0));
        ERC20VaultAction vault = ERC20VaultAction(newAction);
        assertEq(address(vault.token()), address(existingToken));

        // Verify vaultManager has VAULT_MANAGER role
        assertTrue(vault.hasRole(vault.VAULT_MANAGER(), vaultManager));
    }

    function test_createETHVaultAction() public {
        // First deploy an org
        string memory orgId = "action-test-org-4";
        address orgAdmin = address(0x9999);
        address vaultManager = address(0x999A);
        (address slashTip,,,) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), "", "", 0);

        // Create a new ETH vault action (as factory manager)
        address newAction = factory.createETHVaultAction(slashTip, orgAdmin, vaultManager);

        assertTrue(newAction != address(0));

        // Verify vaultManager has VAULT_MANAGER role
        ETHVaultAction vault = ETHVaultAction(payable(newAction));
        assertTrue(vault.hasRole(vault.VAULT_MANAGER(), vaultManager));
    }

    function test_createAction_revertIfNotFactoryManager() public {
        string memory orgId = "auth-test-org";
        address orgAdmin = address(0xAAAA);
        (address slashTip,,,) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), "", "", 0);

        address notManager = address(0xBBBB);
        vm.prank(notManager);
        vm.expectRevert();
        factory.createERC1155Action(slashTip, orgAdmin, _operators(), "", "", 0);
    }

    function test_upgradeSlashTip() public {
        // Deploy a new implementation
        SlashTip newImpl = new SlashTip();

        factory.upgradeSlashTip(address(newImpl));

        (address impl,,,,,,,) = factory.getImplementations();
        assertEq(impl, address(newImpl));
    }

    function test_upgrade_revertIfNotAdmin() public {
        SlashTip newImpl = new SlashTip();

        address notAdmin = address(0xCCCC);
        vm.prank(notAdmin);
        vm.expectRevert();
        factory.upgradeSlashTip(address(newImpl));
    }

    function test_fullIntegration_ERC1155() public {
        // Deploy org with operator as tip executor
        string memory orgId = "integration-test";
        address orgAdmin = address(0xDDDD);
        (
            address slashTipAddr,
            address userRegistryAddr,
            ,
            address tipTokenAddr
        ) = factory.deployWithERC1155(orgId, orgAdmin, _operators(), "https://test.com/", "", 1);

        SlashTip slashTip = SlashTip(slashTipAddr);
        UserRegistry userRegistry = UserRegistry(userRegistryAddr);
        TipERC1155 tipToken = TipERC1155(tipTokenAddr);

        // Add users as operator (not admin)
        vm.startPrank(operator1);

        UserRegistry.User memory user1 = UserRegistry.User({
            id: "user1",
            nickname: "alice",
            account: address(0xE001),
            allowance: 10
        });
        UserRegistry.User memory user2 = UserRegistry.User({
            id: "user2",
            nickname: "bob",
            account: address(0xE002),
            allowance: 5
        });

        userRegistry.addUser("user1", user1);
        userRegistry.addUser("user2", user2);

        // Send a tip as operator
        slashTip.tip("user1", "user2", 3, "great work!");

        vm.stopPrank();

        // Verify results
        assertEq(userRegistry.getUserAllowance("user1"), 7); // 10 - 3
        assertEq(tipToken.balanceOf(address(0xE002), 1), 3);
    }

    function test_deployWithMultipleOperators() public {
        string memory orgId = "multi-op-test";
        address orgAdmin = address(0xFFFF);

        (
            address slashTip,
            address userRegistry,
            ,
        ) = factory.deployWithERC1155(orgId, orgAdmin, _multipleOperators(), "", "", 0);

        SlashTip st = SlashTip(slashTip);
        UserRegistry ur = UserRegistry(userRegistry);

        // Verify both operators have OPERATOR role
        assertTrue(st.hasRole(st.TIPPER(), operator1));
        assertTrue(st.hasRole(st.TIPPER(), operator2));
        assertTrue(ur.hasRole(ur.USER_MANAGER(), operator1));
        assertTrue(ur.hasRole(ur.USER_MANAGER(), operator2));

        // Verify admin does NOT have OPERATOR role (separation of concerns)
        assertFalse(st.hasRole(st.TIPPER(), orgAdmin));
        assertFalse(ur.hasRole(ur.USER_MANAGER(), orgAdmin));

        // Admin still has DEFAULT_ADMIN_ROLE
        assertTrue(st.hasRole(st.DEFAULT_ADMIN_ROLE(), orgAdmin));
        assertTrue(ur.hasRole(ur.DEFAULT_ADMIN_ROLE(), orgAdmin));
    }
}
