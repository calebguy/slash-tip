// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {TipERC1155} from "../src/contracts/TipERC1155.sol";
import {ERC1155MintAction} from "../src/contracts/ERC1155MintAction.sol";
import {BeaconProxy} from "openzeppelin/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "openzeppelin/proxy/beacon/UpgradeableBeacon.sol";

/// @notice Tests for the V2 SlashTip orchestrator contract
contract V2SlashTipTest is Test {
    SlashTip public slashTip;
    UserRegistry public userRegistry;
    TipERC1155 public tipToken;
    ERC1155MintAction public tipAction;

    address public admin = address(this);
    string public orgId = "test-org-123";
    string public baseURI = "https://example.com/tokens/";
    uint256 public tokenId = 1;

    string public fromUserId = "U123ABC";
    string public toUserId = "U456DEF";

    UserRegistry.User public fromUser = UserRegistry.User({
        id: "U123ABC",
        nickname: "alice",
        account: address(0x1111),
        allowance: 10
    });

    UserRegistry.User public toUser = UserRegistry.User({
        id: "U456DEF",
        nickname: "bob",
        account: address(0x2222),
        allowance: 5
    });

    function setUp() public {
        // Deploy UserRegistry with beacon proxy
        UserRegistry userRegistryImpl = new UserRegistry();
        UpgradeableBeacon userRegistryBeacon = new UpgradeableBeacon(address(userRegistryImpl), admin);
        bytes memory userRegistryInitData = abi.encodeWithSelector(
            UserRegistry.initialize.selector,
            admin,
            orgId
        );
        BeaconProxy userRegistryProxy = new BeaconProxy(address(userRegistryBeacon), userRegistryInitData);
        userRegistry = UserRegistry(address(userRegistryProxy));

        // Deploy TipERC1155 with beacon proxy
        TipERC1155 tipTokenImpl = new TipERC1155();
        UpgradeableBeacon tipTokenBeacon = new UpgradeableBeacon(address(tipTokenImpl), admin);
        bytes memory tipTokenInitData = abi.encodeWithSelector(
            TipERC1155.initialize.selector,
            admin,
            baseURI,
            ""
        );
        BeaconProxy tipTokenProxy = new BeaconProxy(address(tipTokenBeacon), tipTokenInitData);
        tipToken = TipERC1155(address(tipTokenProxy));

        // Deploy ERC1155MintAction with beacon proxy
        ERC1155MintAction tipActionImpl = new ERC1155MintAction();
        UpgradeableBeacon tipActionBeacon = new UpgradeableBeacon(address(tipActionImpl), admin);
        bytes memory tipActionInitData = abi.encodeWithSelector(
            ERC1155MintAction.initialize.selector,
            admin,
            address(tipToken),
            tokenId
        );
        BeaconProxy tipActionProxy = new BeaconProxy(address(tipActionBeacon), tipActionInitData);
        tipAction = ERC1155MintAction(address(tipActionProxy));

        // Deploy SlashTip with beacon proxy
        SlashTip slashTipImpl = new SlashTip();
        UpgradeableBeacon slashTipBeacon = new UpgradeableBeacon(address(slashTipImpl), admin);
        bytes memory slashTipInitData = abi.encodeWithSelector(
            SlashTip.initialize.selector,
            admin,
            address(userRegistry),
            address(tipAction),
            orgId
        );
        BeaconProxy slashTipProxy = new BeaconProxy(address(slashTipBeacon), slashTipInitData);
        slashTip = SlashTip(address(slashTipProxy));

        // Grant TIP_MINTER role to tipAction so it can mint tokens
        tipToken.grantRole(tipToken.MINTER(), address(tipAction));

        // Grant TIP_EXECUTOR role to slashTip so it can call the action
        tipAction.grantRole(tipAction.EXECUTOR(), address(slashTip));

        // Grant OPERATOR to slashTip so it can call subUserAllowance
        userRegistry.grantRole(userRegistry.ALLOWANCE_MANAGER(), address(slashTip));

        // Grant operational roles to admin for testing
        slashTip.grantRole(slashTip.TIPPER(), admin);
        userRegistry.grantRole(userRegistry.USER_MANAGER(), admin);
        userRegistry.grantRole(userRegistry.ALLOWANCE_MANAGER(), admin);
        userRegistry.grantRole(userRegistry.ALLOWANCE_ADMIN(), admin);

        // Add test users
        userRegistry.addUser(fromUserId, fromUser);
        userRegistry.addUser(toUserId, toUser);
    }

    function test_initialize() public view {
        assertEq(slashTip.orgId(), orgId);
        assertEq(address(slashTip.userRegistry()), address(userRegistry));
        assertEq(address(slashTip.tipAction()), address(tipAction));
        assertTrue(slashTip.hasRole(slashTip.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_tip() public {
        uint256 amount = 3;
        string memory message = "great work!";

        uint256 initialAllowance = userRegistry.getUserAllowance(fromUserId);

        slashTip.tip(fromUserId, toUserId, amount, message);

        // Check allowance was deducted
        assertEq(userRegistry.getUserAllowance(fromUserId), initialAllowance - amount);

        // Check tokens were minted to recipient
        assertEq(tipToken.balanceOf(toUser.account, tokenId), amount);
    }

    function test_tip_emitsEvent() public {
        uint256 amount = 1;
        string memory message = "thanks!";

        vm.expectEmit(true, true, true, true);
        emit SlashTip.Tipped(
            fromUserId,
            toUserId,
            fromUser.account,
            fromUserId,
            toUserId,
            toUser.account,
            amount,
            message,
            address(tipAction)
        );
        slashTip.tip(fromUserId, toUserId, amount, message);
    }

    function test_tip_revertIfInsufficientAllowance() public {
        uint256 amount = fromUser.allowance + 1;

        vm.expectRevert(
            abi.encodeWithSelector(
                SlashTip.InsufficientAllowance.selector,
                fromUserId,
                fromUser.allowance,
                amount
            )
        );
        slashTip.tip(fromUserId, toUserId, amount, "");
    }

    function test_tip_revertIfUserNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(UserRegistry.UserNotFound.selector, "nonexistent"));
        slashTip.tip("nonexistent", toUserId, 1, "");
    }

    function test_allowanceOf() public view {
        assertEq(slashTip.allowanceOf(fromUserId), fromUser.allowance);
        assertEq(slashTip.allowanceOf(toUserId), toUser.allowance);
    }

    function test_setAllowanceForAllUsers() public {
        uint256 newAllowance = 20;
        userRegistry.setAllowanceForAllUsers(newAllowance);

        assertEq(userRegistry.getUserAllowance(fromUserId), newAllowance);
        assertEq(userRegistry.getUserAllowance(toUserId), newAllowance);
    }

    function test_addAllowanceForAllUsers() public {
        uint256 addAmount = 5;
        userRegistry.addAllowanceForAllUsers(addAmount);

        assertEq(userRegistry.getUserAllowance(fromUserId), fromUser.allowance + addAmount);
        assertEq(userRegistry.getUserAllowance(toUserId), toUser.allowance + addAmount);
    }

    function test_setTipAction() public {
        // Deploy a new tip action
        ERC1155MintAction newActionImpl = new ERC1155MintAction();
        UpgradeableBeacon newActionBeacon = new UpgradeableBeacon(address(newActionImpl), admin);
        bytes memory newActionInitData = abi.encodeWithSelector(
            ERC1155MintAction.initialize.selector,
            admin,
            address(tipToken),
            2 // different token ID
        );
        BeaconProxy newActionProxy = new BeaconProxy(address(newActionBeacon), newActionInitData);
        ERC1155MintAction newAction = ERC1155MintAction(address(newActionProxy));

        // Grant minter role to new action
        tipToken.grantRole(tipToken.MINTER(), address(newAction));

        vm.expectEmit(true, true, true, true);
        emit SlashTip.TipActionUpdated(address(tipAction), address(newAction));
        slashTip.setTipAction(address(newAction));

        assertEq(address(slashTip.tipAction()), address(newAction));
    }

    function test_setUserRegistry() public {
        // Deploy a new user registry
        UserRegistry newRegistryImpl = new UserRegistry();
        UpgradeableBeacon newRegistryBeacon = new UpgradeableBeacon(address(newRegistryImpl), admin);
        bytes memory newRegistryInitData = abi.encodeWithSelector(
            UserRegistry.initialize.selector,
            admin,
            "new-org"
        );
        BeaconProxy newRegistryProxy = new BeaconProxy(address(newRegistryBeacon), newRegistryInitData);
        UserRegistry newRegistry = UserRegistry(address(newRegistryProxy));

        vm.expectEmit(true, true, true, true);
        emit SlashTip.UserRegistryUpdated(address(userRegistry), address(newRegistry));
        slashTip.setUserRegistry(address(newRegistry));

        assertEq(address(slashTip.userRegistry()), address(newRegistry));
    }

    function test_onlyOperator_tip() public {
        address nonOperator = address(0x9999);

        vm.prank(nonOperator);
        vm.expectRevert();
        slashTip.tip(fromUserId, toUserId, 1, "");
    }

    function test_onlyAdmin_setTipAction() public {
        address nonAdmin = address(0x9999);

        vm.prank(nonAdmin);
        vm.expectRevert();
        slashTip.setTipAction(address(0x1234));
    }
}
