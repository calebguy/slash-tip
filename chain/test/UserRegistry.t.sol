// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import "forge-std/console.sol";

contract UserRegistryTest is Test {
    UserRegistry public registry;
    string description = "User registry";

    function setUp() public {
        registry = new UserRegistry(address(this), description);
    }

    function test_getDescription() public view {
       assertEq(registry.description(), description);
    }

    function test_userNotExistsAllowanceZero() public view {
        string memory userId = "user1";
        uint256 allowance = registry.getUserAllowance(userId);
        assertEq(allowance, 0);
    }

    function test_userNotExistsGetUser() public view {
        string memory userId = "user1";
        address user = registry.getUser(userId);
        assertEq(user, address(0));
    }
    
    function test_addUser() public {
        string memory userId = "user1";
        address user = address(0x1);
        registry.addUser(userId, user);
        assertEq(registry.getUser(userId), user);
    }

    function test_removeUser() public {
        string memory userId = "user1";
        address user = address(0x1);
        registry.addUser(userId, user);
        registry.removeUser(userId);
        assertEq(registry.getUser(userId), address(0));
    }

    function test_userAllowance() public {
        string memory userId = "user1";
        address user = address(0x1);
        registry.addUser(userId, user);
        registry.setUserAllowance(userId, 100);
        assertEq(registry.getUserAllowance(userId), 100);
    }

    function test_userAddAllowance() public {
        string memory userId = "user1";
        address user = address(0x1);
        registry.addUser(userId, user);
        registry.setUserAllowance(userId, 100);
        registry.addUserAllowance(userId, 50);
        assertEq(registry.getUserAllowance(userId), 150);
    }

    function test_userSubAllowance() public {
        string memory userId = "user1";
        address user = address(0x1);
        registry.addUser(userId, user);
        registry.setUserAllowance(userId, 100);
        registry.subUserAllowance(userId, 50);
        assertEq(registry.getUserAllowance(userId), 50);
    }

    function test_hasUserRegistryManagerRole() public view {
        bytes32 role = keccak256("USER_REGISTRY_MANAGER");
        assertEq(registry.hasRole(role, address(this)), true);
    }

    function test_hasDefaultAdminRole() public view {
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        assertEq(registry.hasRole(DEFAULT_ADMIN_ROLE, address(this)), true);
    }
}
