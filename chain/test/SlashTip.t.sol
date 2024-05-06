// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {Tip} from "../src/contracts/Tip.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";

contract SlashTipTest is Test {  
    function setUp() public {
        registry = new UserRegistry(address(this))
        tip = new SlashTip(address(this), baseURI);
    }
}
