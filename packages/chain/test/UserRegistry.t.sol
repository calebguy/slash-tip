// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import "forge-std/console.sol";

contract UserRegistryTest is Test {
    UserRegistry public registry;
    string description = "User registry";

    string public userId = "user1";
    UserRegistry.User public user = UserRegistry.User({
        id: "user1",
        nickname: "a test user",
        account: 0x18F33CEf45817C428d98C4E188A770191fDD4B79,
        allowance: 10
    });

    function setUp() public {
        registry = new UserRegistry(address(this), description);
    }

    function test_getDescription() public view {
       assertEq(registry.description(), description);
    }

    function test_getUserDoesNotExist() public {
        vm.expectRevert(bytes("User does not exist"));
        registry.getUser(userId);
    }

    function test_getUserAllowanceDoesNotExist() public {
        vm.expectRevert(bytes("User does not exist"));
        registry.getUserAllowance(userId);
    }

    function test_getUserAddressDoesNotExist() public {
        vm.expectRevert(bytes("User does not exist"));
        registry.getUserAddress(userId);
    }
    
    function test_addUser() public {
        registry.addUser(userId, user);
        UserRegistry.User memory _user = registry.getUser(userId);
        assertEq(_user.account, user.account);
        assertEq(_user.allowance, user.allowance);
        assertEq(_user.nickname, user.nickname);
    }

    function test_removeUser() public {
        registry.addUser(userId, user);
        registry.removeUser(userId);

        vm.expectRevert(bytes("User does not exist"));
        registry.getUser(userId);
    }

    function test_userSetAllowance() public {
        registry.addUser(userId, user);
        uint256 allowance = 100;
        registry.setUserAllowance(userId, allowance);
        assertEq(registry.getUserAllowance(userId), allowance);

        UserRegistry.User memory _user = registry.getUser(userId);
        assertEq(_user.allowance, allowance);
    }

    function test_userAddAllowance() public {
        registry.addUser(userId, user);
        registry.setUserAllowance(userId, 100);
        registry.addUserAllowance(userId, 50);
        assertEq(registry.getUserAllowance(userId), 150);
    }

    function test_userSubAllowance() public {
        registry.addUser(userId, user);
        registry.setUserAllowance(userId, 100);
        registry.subUserAllowance(userId, 30);
        assertEq(registry.getUserAllowance(userId), 70);
    }

    function test_hasUserRegistryManagerRole() public view {
        bytes32 role = keccak256("USER_REGISTRY_MANAGER");
        assertEq(registry.hasRole(role, address(this)), true);
    }

    function test_hasDefaultAdminRole() public view {
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        assertEq(registry.hasRole(DEFAULT_ADMIN_ROLE, address(this)), true);
    }

    function test_listUsers() public {
        registry.addUser(userId, user);

        string memory userId2 = "user2";
        address account2 = 0x9a37E57d177c5Ff8817B55da36F2A2b3532CDE3F;
        string memory nickname2 = "another test";
        uint256 allowance2 = 20;
        registry.addUser("user2", UserRegistry.User({
            id: userId2,
            nickname: nickname2,
            account: account2,
            allowance: allowance2
        }));
        UserRegistry.User[] memory users = registry.listUsers();
        assertEq(users.length, 2);
        assertEq(users[0].account, user.account);
        assertEq(users[0].allowance, user.allowance);
        assertEq(users[0].nickname, user.nickname);
        assertEq(users[1].account, account2);
        assertEq(users[1].allowance, allowance2);
        assertEq(users[1].nickname, nickname2);
    }
}
