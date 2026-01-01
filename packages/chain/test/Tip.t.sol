// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {DeprecatedTip} from "../src/contracts/DeprecatedTip.sol";
import {Strings} from "openzeppelin/utils/Strings.sol";

/// @notice Tests for the deprecated V1 Tip contract
contract DeprecatedTipTest is Test {
    using Strings for uint256;

    DeprecatedTip public tip;
    string baseURI = "https://example.com/tokens/";

    function setUp() public {
        tip = new DeprecatedTip(address(this), baseURI);
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
