// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Tip} from "../src/contracts/Tip.sol";
import {Strings} from "openzeppelin/utils/Strings.sol";

contract TipTest is Test {
    using Strings for uint256;
  
    Tip public tip;
    string baseURI = "https://example.com/tokens/";

    function setUp() public {
        tip = new Tip(address(this), baseURI);
    }

    function test_baseURI() public view {
        assertEq(tip.baseURI(), baseURI);
    }

    function test_uri() public view {
        uint256 id = 1;
        string memory uri = tip.uri(id);
        assertEq(uri, string(abi.encodePacked(baseURI, id.toString())));
    }

    function test_setBaseURI() public {
        string memory newBaseURI = "https://example.com/tokens2/";
        tip.setBaseURI(newBaseURI);
        assertEq(tip.baseURI(), newBaseURI);
    }

    function test_mint() public {
        address account = address(0x1);
        uint256 id = 5;
        uint256 amount = 100;
        tip.mint(account, id, amount, "");
        assertEq(tip.balanceOf(account, id), amount);
    }
}
