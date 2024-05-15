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

    string public fromUserId = "user1";
    string public toUserId = "user2";
    uint256 tokenId = 1;

    UserRegistry.User public fromUser = UserRegistry.User({
        nickname: "from user",
        account: 0x18F33CEf45817C428d98C4E188A770191fDD4B79,
        allowance: 10
    });

    UserRegistry.User public toUser = UserRegistry.User({
        nickname: "to user",
        account: 0x9a37E57d177c5Ff8817B55da36F2A2b3532CDE3F,
        allowance: 10
    });

    function setUp() public {
        registry = new UserRegistry(address(this), "/users");
        tip = new Tip(address(this), baseURI);
        slash = new SlashTip(address(this), address(registry), address(tip), "/tip");
    
        // slash-tip needs tip manager role in order to mint
        tip.grantRole(keccak256("TIP_MANAGER"), address(slash));

        // slash-tip needs user registry manager role in order to add users
        registry.grantRole(keccak256("USER_REGISTRY_MANAGER"), address(slash));
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
        registry.addUser(fromUserId, fromUser);
        assertEq(registry.getUserAddress(fromUserId), fromUser.account);
        assertEq(registry.getUserAllowance(fromUserId), fromUser.allowance);
    }

    function test_setUserAllownace() public {
        registry.addUser(fromUserId, fromUser);
        uint256 newAllowance = 10;
        registry.setUserAllowance(fromUserId, newAllowance);
        assertEq(registry.getUserAllowance(fromUserId), newAllowance);
    }

    function test_tip() public {
        registry.addUser(fromUserId, fromUser);
        registry.addUser(toUserId, toUser);

        assertEq(registry.getUserAllowance(fromUserId), fromUser.allowance);
        assertEq(registry.getUserAllowance(toUserId), toUser.allowance);

        uint256 amountToMint = 1;
        slash.tip(fromUserId, toUserId, tokenId, amountToMint);
        assertEq(tip.balanceOf(toUser.account, tokenId), amountToMint);
        assertEq(slash.balanceOf(toUserId, tokenId), amountToMint);
        assertEq(slash.allowanceOf(fromUserId), fromUser.allowance - amountToMint);
        assertEq(registry.getUserAllowance(fromUserId), fromUser.allowance - amountToMint);
    }

    function test_tipOverAllowanceRevert() public {
        uint256 allowance = 3;

        registry.addUser(fromUserId, UserRegistry.User({
            nickname: "a test user",
            account: 0x18F33CEf45817C428d98C4E188A770191fDD4B79,
            allowance: allowance
        }));
        registry.addUser(toUserId, UserRegistry.User({
            nickname: "another test user",
            account: 0x9a37E57d177c5Ff8817B55da36F2A2b3532CDE3F,
            allowance: 0
        }));

        vm.expectRevert(bytes("Insufficient allowance to mint"));
        slash.tip(fromUserId, toUserId, tokenId, allowance + 1);
    }
}
