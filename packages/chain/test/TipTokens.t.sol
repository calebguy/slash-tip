// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {TipERC1155} from "../src/contracts/TipERC1155.sol";
import {TipERC20} from "../src/contracts/TipERC20.sol";
import {BeaconProxy} from "openzeppelin/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "openzeppelin/proxy/beacon/UpgradeableBeacon.sol";

/// @notice Tests for TipERC1155 token contract
contract TipERC1155Test is Test {
    TipERC1155 public token;
    address public admin = address(this);
    string public baseURI = "https://example.com/tokens/";
    string public contractURI = "https://example.com/collection.json";

    address public recipient = address(0x1111);
    uint256 public tokenId = 1;

    function setUp() public {
        TipERC1155 implementation = new TipERC1155();
        UpgradeableBeacon beacon = new UpgradeableBeacon(address(implementation), admin);
        bytes memory initData = abi.encodeWithSelector(
            TipERC1155.initialize.selector,
            admin,
            baseURI,
            contractURI
        );
        BeaconProxy proxy = new BeaconProxy(address(beacon), initData);
        token = TipERC1155(address(proxy));

        // Grant roles to admin for testing
        token.grantRole(token.METADATA_MANAGER(), admin);
        token.grantRole(token.MINTER(), admin);
    }

    function test_initialize() public view {
        assertEq(token.baseURI(), baseURI);
        assertEq(token.contractURI(), contractURI);
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        // MINTER is no longer auto-granted in initialize, must be explicitly granted
    }

    function test_uri() public view {
        assertEq(token.uri(tokenId), string(abi.encodePacked(baseURI, "1")));
        assertEq(token.uri(123), string(abi.encodePacked(baseURI, "123")));
    }

    function test_uri_emptyBaseURI() public {
        // Deploy with empty base URI
        TipERC1155 implementation = new TipERC1155();
        UpgradeableBeacon beacon = new UpgradeableBeacon(address(implementation), admin);
        bytes memory initData = abi.encodeWithSelector(
            TipERC1155.initialize.selector,
            admin,
            "",
            contractURI
        );
        BeaconProxy proxy = new BeaconProxy(address(beacon), initData);
        TipERC1155 emptyToken = TipERC1155(address(proxy));

        assertEq(emptyToken.uri(tokenId), "");
    }

    function test_mint() public {
        uint256 amount = 5;
        token.mint(recipient, tokenId, amount, "");

        assertEq(token.balanceOf(recipient, tokenId), amount);
    }

    function test_mintBatch() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1;
        ids[1] = 2;
        ids[2] = 3;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 10;
        amounts[1] = 20;
        amounts[2] = 30;

        token.mintBatch(recipient, ids, amounts, "");

        assertEq(token.balanceOf(recipient, 1), 10);
        assertEq(token.balanceOf(recipient, 2), 20);
        assertEq(token.balanceOf(recipient, 3), 30);
    }

    function test_setBaseURI() public {
        string memory newBaseURI = "https://new.example.com/tokens/";

        vm.expectEmit(true, true, true, true);
        emit TipERC1155.BaseURIUpdated(baseURI, newBaseURI);
        token.setBaseURI(newBaseURI);

        assertEq(token.baseURI(), newBaseURI);
    }

    function test_setContractURI() public {
        string memory newContractURI = "https://new.example.com/collection.json";

        vm.expectEmit(true, true, true, true);
        emit TipERC1155.ContractURIUpdated(contractURI, newContractURI);
        token.setContractURI(newContractURI);

        assertEq(token.contractURI(), newContractURI);
    }

    function test_onlyMinter() public {
        address nonMinter = address(0x9999);

        vm.prank(nonMinter);
        vm.expectRevert();
        token.mint(recipient, tokenId, 1, "");
    }

    function test_onlyOperator_setBaseURI() public {
        address nonOperator = address(0x9999);

        vm.prank(nonOperator);
        vm.expectRevert();
        token.setBaseURI("https://hacker.com/");
    }

    function test_supportsInterface() public view {
        // ERC1155
        assertTrue(token.supportsInterface(0xd9b67a26));
        // ERC1155MetadataURI
        assertTrue(token.supportsInterface(0x0e89341c));
        // ERC165
        assertTrue(token.supportsInterface(0x01ffc9a7));
    }
}

/// @notice Tests for TipERC20 token contract
contract TipERC20Test is Test {
    TipERC20 public token;
    address public admin = address(this);
    string public tokenName = "Tip Token";
    string public tokenSymbol = "TIP";
    uint8 public tokenDecimals = 18;

    address public recipient = address(0x1111);

    function setUp() public {
        TipERC20 implementation = new TipERC20();
        UpgradeableBeacon beacon = new UpgradeableBeacon(address(implementation), admin);
        bytes memory initData = abi.encodeWithSelector(
            TipERC20.initialize.selector,
            admin,
            tokenName,
            tokenSymbol,
            tokenDecimals
        );
        BeaconProxy proxy = new BeaconProxy(address(beacon), initData);
        token = TipERC20(address(proxy));

        // Grant MINTER role to admin for testing
        token.grantRole(token.MINTER(), admin);
    }

    function test_initialize() public view {
        assertEq(token.name(), tokenName);
        assertEq(token.symbol(), tokenSymbol);
        assertEq(token.decimals(), tokenDecimals);
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin));
        // MINTER is no longer auto-granted in initialize, must be explicitly granted
    }

    function test_customDecimals() public {
        // Deploy with 6 decimals (like USDC)
        TipERC20 implementation = new TipERC20();
        UpgradeableBeacon beacon = new UpgradeableBeacon(address(implementation), admin);
        bytes memory initData = abi.encodeWithSelector(
            TipERC20.initialize.selector,
            admin,
            "USD Tip",
            "USDTIP",
            uint8(6)
        );
        BeaconProxy proxy = new BeaconProxy(address(beacon), initData);
        TipERC20 usdToken = TipERC20(address(proxy));

        assertEq(usdToken.decimals(), 6);
    }

    function test_mint() public {
        uint256 amount = 1000 * 10 ** 18;
        token.mint(recipient, amount);

        assertEq(token.balanceOf(recipient), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_burn() public {
        uint256 mintAmount = 1000 * 10 ** 18;
        uint256 burnAmount = 400 * 10 ** 18;

        token.mint(recipient, mintAmount);
        token.burn(recipient, burnAmount);

        assertEq(token.balanceOf(recipient), mintAmount - burnAmount);
        assertEq(token.totalSupply(), mintAmount - burnAmount);
    }

    function test_onlyMinter_mint() public {
        address nonMinter = address(0x9999);

        vm.prank(nonMinter);
        vm.expectRevert();
        token.mint(recipient, 1000);
    }

    function test_onlyMinter_burn() public {
        address nonMinter = address(0x9999);
        token.mint(recipient, 1000);

        vm.prank(nonMinter);
        vm.expectRevert();
        token.burn(recipient, 500);
    }

    function test_transfer() public {
        uint256 amount = 1000 * 10 ** 18;
        address recipient2 = address(0x2222);

        token.mint(recipient, amount);

        vm.prank(recipient);
        token.transfer(recipient2, 300 * 10 ** 18);

        assertEq(token.balanceOf(recipient), 700 * 10 ** 18);
        assertEq(token.balanceOf(recipient2), 300 * 10 ** 18);
    }
}
