// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {Tip} from "../src/contracts/Tip.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";
import "forge-std/console.sol";

contract SlashTipTest is Test {
    string public baseURI = "https://example.com/tokens/";
    UserRegistry public registry;
    Tip public tip;
    SlashTip public slash;

    uint256 public allowance;
    string public userId;
    address public userAddress;

    function setUp() public {
        allowance = 10;
        userId = "user1";
        userAddress = 0x18F33CEf45817C428d98C4E188A770191fDD4B79;

        registry = new UserRegistry(address(this), "/users");
        tip = new Tip(address(this), baseURI);
        slash = new SlashTip(address(this), address(registry), address(tip), "/tip");
    
        // slash-tip needs tip manager role in order to mint
        bytes32 tipManagerRole = keccak256("TIP_MANAGER");
        tip.grantRole(tipManagerRole, address(slash));
    }

    function addUser(string memory _userId, address _userAddress, uint256 _allownace) public {
        registry.addUser(_userId, _userAddress);
        registry.setUserAllowance(_userId, _allownace);
    }

    function test_description() public view {
        assertEq(slash.description(), "/tip");
    }

    function test_roles() public view {
        address randomAddress = 0x18F33CEf45817C428d98C4E188A770191fDD4B79;
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        assertEq(slash.hasRole(DEFAULT_ADMIN_ROLE, address(this)), true);
        assertEq(slash.hasRole(DEFAULT_ADMIN_ROLE, address(0)), false);
        assertEq(slash.hasRole(DEFAULT_ADMIN_ROLE, randomAddress), false);

        bytes32 slashTipManagerRole = keccak256("SLASH_TIP_MANAGER");
        assertEq(slash.hasRole(slashTipManagerRole, address(this)), true);
        assertEq(slash.hasRole(slashTipManagerRole, address(0)), false);
        assertEq(slash.hasRole(slashTipManagerRole, randomAddress), false);
    }

    function test_addUser() public {
        addUser(userId, userAddress, allowance);
        assertEq(registry.getUserAddress(userId), userAddress);
        assertEq(registry.getUserAllowance(userId), allowance);
    }

    function test_setUserAllownace() public {
        addUser(userId, userAddress, allowance);
        registry.setUserAllowance(userId, allowance);
        assertEq(registry.getUserAllowance(userId), allowance);
    }

    function test_tip() public {
        addUser(userId, userAddress, allowance);

        uint256 tokenId = 1;
        uint256 amountToMint = allowance - 5;
        slash.tip(userId, tokenId, amountToMint);
        assertEq(tip.balanceOf(userAddress, tokenId), amountToMint);
        assertEq(slash.balanceOf(userId, tokenId), amountToMint);
    }

    function test_tipOverAllowanceRevert() public {
        registry.addUser(userId, userAddress);

        allowance = 5;
        registry.setUserAllowance(userId, allowance);
        vm.expectRevert(bytes("Insufficient allowance"));
        slash.tip(userId, 1, allowance + 1);
    }
}
