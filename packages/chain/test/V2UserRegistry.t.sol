// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {BeaconProxy} from "openzeppelin/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "openzeppelin/proxy/beacon/UpgradeableBeacon.sol";

/// @notice Tests for the V2 UserRegistry contract with beacon proxy pattern
contract V2UserRegistryTest is Test {
    UserRegistry public registry;
    UserRegistry public implementation;
    UpgradeableBeacon public beacon;

    address public admin = address(this);
    string public orgId = "test-org-123";

    string public userId1 = "U123ABC";
    string public userId2 = "U456DEF";

    UserRegistry.User public user1 = UserRegistry.User({
        id: "U123ABC",
        nickname: "alice",
        account: address(0x1111),
        allowance: 10
    });

    UserRegistry.User public user2 = UserRegistry.User({
        id: "U456DEF",
        nickname: "bob",
        account: address(0x2222),
        allowance: 5
    });

    function setUp() public {
        // Deploy implementation
        implementation = new UserRegistry();

        // Deploy beacon
        beacon = new UpgradeableBeacon(address(implementation), admin);

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            UserRegistry.initialize.selector,
            admin,
            orgId
        );
        BeaconProxy proxy = new BeaconProxy(address(beacon), initData);
        registry = UserRegistry(address(proxy));

        // Grant operational roles to admin for testing
        registry.grantRole(registry.USER_MANAGER(), admin);
        registry.grantRole(registry.ALLOWANCE_MANAGER(), admin);
    }

    function test_initialize() public view {
        assertEq(registry.orgId(), orgId);
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
    }

    function test_addUser() public {
        registry.addUser(userId1, user1);

        UserRegistry.User memory retrieved = registry.getUser(userId1);
        assertEq(retrieved.id, user1.id);
        assertEq(retrieved.nickname, user1.nickname);
        assertEq(retrieved.account, user1.account);
        assertEq(retrieved.allowance, user1.allowance);
    }

    function test_addUser_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit UserRegistry.UserAdded(userId1, userId1, user1.nickname, user1.account);
        registry.addUser(userId1, user1);
    }

    function test_addUser_revertIfAlreadyExists() public {
        registry.addUser(userId1, user1);

        vm.expectRevert(abi.encodeWithSelector(UserRegistry.UserAlreadyExists.selector, userId1));
        registry.addUser(userId1, user1);
    }

    function test_addUser_revertIfInvalidAccount() public {
        UserRegistry.User memory invalidUser = UserRegistry.User({
            id: "invalid",
            nickname: "invalid",
            account: address(0),
            allowance: 10
        });

        vm.expectRevert(UserRegistry.InvalidUser.selector);
        registry.addUser("invalid", invalidUser);
    }

    function test_addUser_revertIfEmptyNickname() public {
        UserRegistry.User memory invalidUser = UserRegistry.User({
            id: "invalid",
            nickname: "",
            account: address(0x1111),
            allowance: 10
        });

        vm.expectRevert(UserRegistry.InvalidUser.selector);
        registry.addUser("invalid", invalidUser);
    }

    function test_removeUser() public {
        registry.addUser(userId1, user1);
        assertEq(registry.userCount(), 1);

        registry.removeUser(userId1);
        assertEq(registry.userCount(), 0);
        assertFalse(registry.userExists(userId1));
    }

    function test_removeUser_emitsEvent() public {
        registry.addUser(userId1, user1);

        vm.expectEmit(true, true, true, true);
        emit UserRegistry.UserRemoved(userId1, userId1);
        registry.removeUser(userId1);
    }

    function test_removeUser_revertIfNotFound() public {
        vm.expectRevert(abi.encodeWithSelector(UserRegistry.UserNotFound.selector, "nonexistent"));
        registry.removeUser("nonexistent");
    }

    function test_userExists() public {
        assertFalse(registry.userExists(userId1));

        registry.addUser(userId1, user1);
        assertTrue(registry.userExists(userId1));
    }

    function test_getUserAddress() public {
        registry.addUser(userId1, user1);
        assertEq(registry.getUserAddress(userId1), user1.account);
    }

    function test_getUserAllowance() public {
        registry.addUser(userId1, user1);
        assertEq(registry.getUserAllowance(userId1), user1.allowance);
    }

    function test_setUserAllowance() public {
        registry.addUser(userId1, user1);

        uint256 newAllowance = 20;
        registry.setUserAllowance(userId1, newAllowance);
        assertEq(registry.getUserAllowance(userId1), newAllowance);
    }

    function test_setUserAllowance_emitsEvent() public {
        registry.addUser(userId1, user1);

        uint256 newAllowance = 20;
        vm.expectEmit(true, true, true, true);
        emit UserRegistry.AllowanceUpdated(userId1, userId1, user1.allowance, newAllowance);
        registry.setUserAllowance(userId1, newAllowance);
    }

    function test_addUserAllowance() public {
        registry.addUser(userId1, user1);

        uint256 addAmount = 5;
        registry.addUserAllowance(userId1, addAmount);
        assertEq(registry.getUserAllowance(userId1), user1.allowance + addAmount);
    }

    function test_subUserAllowance() public {
        registry.addUser(userId1, user1);

        uint256 subAmount = 3;
        registry.subUserAllowance(userId1, subAmount);
        assertEq(registry.getUserAllowance(userId1), user1.allowance - subAmount);
    }

    function test_subUserAllowance_revertIfInsufficient() public {
        registry.addUser(userId1, user1);

        vm.expectRevert("Insufficient allowance");
        registry.subUserAllowance(userId1, user1.allowance + 1);
    }

    function test_listUsers() public {
        registry.addUser(userId1, user1);
        registry.addUser(userId2, user2);

        UserRegistry.User[] memory users = registry.listUsers();
        assertEq(users.length, 2);
    }

    function test_userCount() public {
        assertEq(registry.userCount(), 0);

        registry.addUser(userId1, user1);
        assertEq(registry.userCount(), 1);

        registry.addUser(userId2, user2);
        assertEq(registry.userCount(), 2);

        registry.removeUser(userId1);
        assertEq(registry.userCount(), 1);
    }

    function test_onlyOperator() public {
        address nonOperator = address(0x9999);

        vm.prank(nonOperator);
        vm.expectRevert();
        registry.addUser(userId1, user1);
    }
}
