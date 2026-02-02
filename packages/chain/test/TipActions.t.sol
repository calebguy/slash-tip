// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {ERC1155MintAction} from "../src/contracts/ERC1155MintAction.sol";
import {ERC20MintAction} from "../src/contracts/ERC20MintAction.sol";
import {ERC20VaultAction} from "../src/contracts/ERC20VaultAction.sol";
import {ETHVaultAction} from "../src/contracts/ETHVaultAction.sol";
import {TipERC1155} from "../src/contracts/TipERC1155.sol";
import {TipERC20} from "../src/contracts/TipERC20.sol";
import {BeaconProxy} from "openzeppelin/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "openzeppelin/proxy/beacon/UpgradeableBeacon.sol";
import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";

/// @notice Mock ERC20 for testing vault actions
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @notice Tests for ERC1155MintAction
contract ERC1155MintActionTest is Test {
    ERC1155MintAction public action;
    TipERC1155 public token;
    address public admin = address(this);
    uint256 public tokenId = 1;

    address public sender = address(0x1111);
    address public recipient = address(0x2222);

    function setUp() public {
        // Deploy TipERC1155
        TipERC1155 tokenImpl = new TipERC1155();
        UpgradeableBeacon tokenBeacon = new UpgradeableBeacon(address(tokenImpl), admin);
        bytes memory tokenInitData = abi.encodeWithSelector(
            TipERC1155.initialize.selector,
            admin,
            "https://example.com/",
            ""
        );
        BeaconProxy tokenProxy = new BeaconProxy(address(tokenBeacon), tokenInitData);
        token = TipERC1155(address(tokenProxy));

        // Deploy ERC1155MintAction
        ERC1155MintAction actionImpl = new ERC1155MintAction();
        UpgradeableBeacon actionBeacon = new UpgradeableBeacon(address(actionImpl), admin);
        bytes memory actionInitData = abi.encodeWithSelector(
            ERC1155MintAction.initialize.selector,
            admin,
            address(token),
            tokenId
        );
        BeaconProxy actionProxy = new BeaconProxy(address(actionBeacon), actionInitData);
        action = ERC1155MintAction(address(actionProxy));

        // Grant minter role to action
        token.grantRole(token.MINTER(), address(action));
        // Grant TIP_EXECUTOR to test contract (simulating SlashTip)
        action.grantRole(action.EXECUTOR(), address(this));
        // Grant OPERATOR to admin for operational functions
        action.grantRole(action.CONFIG_MANAGER(), admin);
    }

    function test_initialize() public view {
        assertEq(address(action.token()), address(token));
        assertEq(action.tokenId(), tokenId);
        assertTrue(action.hasRole(action.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_execute() public {
        uint256 amount = 5;
        action.execute(sender, recipient, amount, "");

        assertEq(token.balanceOf(recipient, tokenId), amount);
    }

    function test_execute_onlyTipExecutor() public {
        address nonExecutor = address(0x9999);
        vm.prank(nonExecutor);
        vm.expectRevert();
        action.execute(sender, recipient, 1, "");
    }

    function test_setToken() public {
        // Deploy new token
        TipERC1155 newTokenImpl = new TipERC1155();
        UpgradeableBeacon newTokenBeacon = new UpgradeableBeacon(address(newTokenImpl), admin);
        bytes memory newTokenInitData = abi.encodeWithSelector(
            TipERC1155.initialize.selector,
            admin,
            "https://new.example.com/",
            ""
        );
        BeaconProxy newTokenProxy = new BeaconProxy(address(newTokenBeacon), newTokenInitData);
        TipERC1155 newToken = TipERC1155(address(newTokenProxy));

        vm.expectEmit(true, true, true, true);
        emit ERC1155MintAction.TokenUpdated(address(token), address(newToken));
        action.setToken(address(newToken));

        assertEq(address(action.token()), address(newToken));
    }

    function test_setTokenId() public {
        uint256 newTokenId = 42;

        vm.expectEmit(true, true, true, true);
        emit ERC1155MintAction.TokenIdUpdated(tokenId, newTokenId);
        action.setTokenId(newTokenId);

        assertEq(action.tokenId(), newTokenId);
    }

    function test_onlyOperator() public {
        address nonOperator = address(0x9999);

        vm.prank(nonOperator);
        vm.expectRevert();
        action.setTokenId(99);
    }
}

/// @notice Tests for ERC20MintAction
contract ERC20MintActionTest is Test {
    ERC20MintAction public action;
    TipERC20 public token;
    address public admin = address(this);

    address public sender = address(0x1111);
    address public recipient = address(0x2222);

    function setUp() public {
        // Deploy TipERC20
        TipERC20 tokenImpl = new TipERC20();
        UpgradeableBeacon tokenBeacon = new UpgradeableBeacon(address(tokenImpl), admin);
        bytes memory tokenInitData = abi.encodeWithSelector(
            TipERC20.initialize.selector,
            admin,
            "Tip Token",
            "TIP",
            uint8(18)
        );
        BeaconProxy tokenProxy = new BeaconProxy(address(tokenBeacon), tokenInitData);
        token = TipERC20(address(tokenProxy));

        // Deploy ERC20MintAction
        ERC20MintAction actionImpl = new ERC20MintAction();
        UpgradeableBeacon actionBeacon = new UpgradeableBeacon(address(actionImpl), admin);
        bytes memory actionInitData = abi.encodeWithSelector(
            ERC20MintAction.initialize.selector,
            admin,
            address(token)
        );
        BeaconProxy actionProxy = new BeaconProxy(address(actionBeacon), actionInitData);
        action = ERC20MintAction(address(actionProxy));

        // Grant minter role to action
        token.grantRole(token.MINTER(), address(action));
        // Grant TIP_EXECUTOR to test contract (simulating SlashTip)
        action.grantRole(action.EXECUTOR(), address(this));
        // Grant OPERATOR to admin for operational functions
        action.grantRole(action.CONFIG_MANAGER(), admin);
    }

    function test_initialize() public view {
        assertEq(address(action.token()), address(token));
        assertTrue(action.hasRole(action.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_execute() public {
        // Amount is now in base units (scaled by server before calling contract)
        uint256 amount = 1000 * 10 ** 18;
        action.execute(sender, recipient, amount, "");

        assertEq(token.balanceOf(recipient), amount);
    }

    function test_setToken() public {
        // Deploy new token
        TipERC20 newTokenImpl = new TipERC20();
        UpgradeableBeacon newTokenBeacon = new UpgradeableBeacon(address(newTokenImpl), admin);
        bytes memory newTokenInitData = abi.encodeWithSelector(
            TipERC20.initialize.selector,
            admin,
            "New Tip",
            "NEWTIP",
            uint8(18)
        );
        BeaconProxy newTokenProxy = new BeaconProxy(address(newTokenBeacon), newTokenInitData);
        TipERC20 newToken = TipERC20(address(newTokenProxy));

        vm.expectEmit(true, true, true, true);
        emit ERC20MintAction.TokenUpdated(address(token), address(newToken));
        action.setToken(address(newToken));

        assertEq(address(action.token()), address(newToken));
    }
}

/// @notice Tests for ERC20VaultAction
contract ERC20VaultActionTest is Test {
    ERC20VaultAction public action;
    MockERC20 public token;
    address public admin = address(this);

    address public sender = address(0x1111);
    address public recipient = address(0x2222);
    address public depositor = address(0x3333);

    function setUp() public {
        // Deploy mock ERC20
        token = new MockERC20();

        // Deploy ERC20VaultAction
        ERC20VaultAction actionImpl = new ERC20VaultAction();
        UpgradeableBeacon actionBeacon = new UpgradeableBeacon(address(actionImpl), admin);
        bytes memory actionInitData = abi.encodeWithSelector(
            ERC20VaultAction.initialize.selector,
            admin,
            address(token)
        );
        BeaconProxy actionProxy = new BeaconProxy(address(actionBeacon), actionInitData);
        action = ERC20VaultAction(address(actionProxy));

        // Grant TIP_EXECUTOR to test contract (simulating SlashTip)
        action.grantRole(action.EXECUTOR(), address(this));

        // Fund the depositor
        token.mint(depositor, 10000 * 10 ** 18);
    }

    function test_initialize() public view {
        assertEq(address(action.token()), address(token));
        assertTrue(action.hasRole(action.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(action.hasRole(action.VAULT_MANAGER(), admin));
    }

    function test_deposit() public {
        uint256 depositAmount = 1000 * 10 ** 18;

        vm.startPrank(depositor);
        token.approve(address(action), depositAmount);

        vm.expectEmit(true, true, true, true);
        emit ERC20VaultAction.Deposit(depositor, depositAmount);
        action.deposit(depositAmount);
        vm.stopPrank();

        assertEq(action.vaultBalance(), depositAmount);
        assertEq(token.balanceOf(address(action)), depositAmount);
    }

    function test_execute() public {
        // Deposit first
        uint256 depositAmount = 1000 * 10 ** 18;
        vm.startPrank(depositor);
        token.approve(address(action), depositAmount);
        action.deposit(depositAmount);
        vm.stopPrank();

        // Execute tip (amount is now in base units, scaled by server)
        uint256 tipAmount = 100 * 10 ** 18;
        action.execute(sender, recipient, tipAmount, "");

        assertEq(token.balanceOf(recipient), tipAmount);
        assertEq(action.vaultBalance(), depositAmount - tipAmount);
    }

    function test_execute_revertIfInsufficientBalance() public {
        // Amount is in base units (scaled by server)
        uint256 tipAmount = 100 * 10 ** 18;

        vm.expectRevert(
            abi.encodeWithSelector(
                ERC20VaultAction.InsufficientVaultBalance.selector,
                0,
                tipAmount
            )
        );
        action.execute(sender, recipient, tipAmount, "");
    }

    function test_withdraw() public {
        // Deposit first
        uint256 depositAmount = 1000 * 10 ** 18;
        vm.startPrank(depositor);
        token.approve(address(action), depositAmount);
        action.deposit(depositAmount);
        vm.stopPrank();

        // Withdraw
        uint256 withdrawAmount = 500 * 10 ** 18;
        vm.expectEmit(true, true, true, true);
        emit ERC20VaultAction.Withdrawal(admin, withdrawAmount);
        action.withdraw(admin, withdrawAmount);

        assertEq(token.balanceOf(admin), withdrawAmount);
        assertEq(action.vaultBalance(), depositAmount - withdrawAmount);
    }

    function test_onlyVaultManager_withdraw() public {
        address nonManager = address(0x9999);

        vm.prank(nonManager);
        vm.expectRevert();
        action.withdraw(nonManager, 100);
    }

    function test_rescueTokens() public {
        // Send some tokens directly to the vault (not through deposit)
        MockERC20 otherToken = new MockERC20();
        otherToken.mint(address(action), 500 * 10 ** 18);

        action.rescueTokens(address(otherToken), admin, 500 * 10 ** 18);
        assertEq(otherToken.balanceOf(admin), 500 * 10 ** 18);
    }
}

/// @notice Tests for ETHVaultAction
contract ETHVaultActionTest is Test {
    ETHVaultAction public action;
    address public admin = address(this);

    address public sender = address(0x1111);
    address public recipient = address(0x2222);

    function setUp() public {
        // Deploy ETHVaultAction
        ETHVaultAction actionImpl = new ETHVaultAction();
        UpgradeableBeacon actionBeacon = new UpgradeableBeacon(address(actionImpl), admin);
        bytes memory actionInitData = abi.encodeWithSelector(
            ETHVaultAction.initialize.selector,
            admin
        );
        BeaconProxy actionProxy = new BeaconProxy(address(actionBeacon), actionInitData);
        action = ETHVaultAction(payable(address(actionProxy)));

        // Grant TIP_EXECUTOR to test contract (simulating SlashTip)
        action.grantRole(action.EXECUTOR(), address(this));

        // Fund the test contract
        vm.deal(address(this), 100 ether);
    }

    function test_initialize() public view {
        assertTrue(action.hasRole(action.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(action.hasRole(action.VAULT_MANAGER(), admin));
    }

    function test_deposit() public {
        uint256 depositAmount = 10 ether;

        vm.expectEmit(true, true, true, true);
        emit ETHVaultAction.Deposit(address(this), depositAmount);
        action.deposit{value: depositAmount}();

        assertEq(action.vaultBalance(), depositAmount);
        assertEq(address(action).balance, depositAmount);
    }

    function test_receive() public {
        uint256 depositAmount = 5 ether;

        vm.expectEmit(true, true, true, true);
        emit ETHVaultAction.Deposit(address(this), depositAmount);
        (bool success,) = address(action).call{value: depositAmount}("");
        assertTrue(success);

        assertEq(action.vaultBalance(), depositAmount);
    }

    function test_execute() public {
        // Deposit first
        uint256 depositAmount = 10 ether;
        action.deposit{value: depositAmount}();

        // Execute tip (amount is now in wei, scaled by server)
        uint256 tipAmount = 1 ether;
        uint256 recipientBalanceBefore = recipient.balance;

        action.execute(sender, recipient, tipAmount, "");

        assertEq(recipient.balance, recipientBalanceBefore + tipAmount);
        assertEq(action.vaultBalance(), depositAmount - tipAmount);
    }

    function test_execute_revertIfInsufficientBalance() public {
        // Amount is in wei (scaled by server)
        uint256 tipAmount = 1 ether;

        vm.expectRevert(
            abi.encodeWithSelector(
                ETHVaultAction.InsufficientVaultBalance.selector,
                0,
                tipAmount
            )
        );
        action.execute(sender, recipient, tipAmount, "");
    }

    function test_withdraw() public {
        // Deposit first
        uint256 depositAmount = 10 ether;
        action.deposit{value: depositAmount}();

        // Withdraw
        uint256 withdrawAmount = 5 ether;
        uint256 adminBalanceBefore = admin.balance;

        vm.expectEmit(true, true, true, true);
        emit ETHVaultAction.Withdrawal(admin, withdrawAmount);
        action.withdraw(admin, withdrawAmount);

        assertEq(admin.balance, adminBalanceBefore + withdrawAmount);
        assertEq(action.vaultBalance(), depositAmount - withdrawAmount);
    }

    function test_onlyVaultManager_withdraw() public {
        action.deposit{value: 10 ether}();

        address nonManager = address(0x9999);
        vm.prank(nonManager);
        vm.expectRevert();
        action.withdraw(nonManager, 1 ether);
    }

    function test_rescueTokens() public {
        // Send some ERC20 tokens to the vault by mistake
        MockERC20 stuckToken = new MockERC20();
        stuckToken.mint(address(action), 500 * 10 ** 18);

        action.rescueTokens(address(stuckToken), admin, 500 * 10 ** 18);
        assertEq(stuckToken.balanceOf(admin), 500 * 10 ** 18);
    }

    receive() external payable {}
}
