// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {DeprecatedUserRegistry} from "../src/contracts/DeprecatedUserRegistry.sol";
import {DeprecatedTip} from "../src/contracts/DeprecatedTip.sol";
import {DeprecatedSlashTip} from "../src/contracts/DeprecatedSlashTip.sol";
import {Script, console} from "forge-std/Script.sol";

/// @notice DEPRECATED: This deploys the legacy V1 contracts. Use DeployV2.s.sol instead.
contract DeprecatedDeployScript is Script {
    function setUp() public {}

    function run() external {
        string memory baseURI = "https://example.com/tokens/";
        uint256 deployer = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployer);

        address admin = 0x18F33CEf45817C428d98C4E188A770191fDD4B79;

        DeprecatedUserRegistry registry = new DeprecatedUserRegistry(admin, "/users");
        DeprecatedTip tip = new DeprecatedTip(admin, baseURI);
        DeprecatedSlashTip slash = new DeprecatedSlashTip(admin, address(registry), address(tip), "/tip");

        string memory tipAddress = string(abi.encodePacked(address(tip)));
        tip.setBaseURI(string.concat("https://metadata.syndicate.io/8453/", tipAddress, "/"));

        // slash-tip needs tip manager role in order to mint
        tip.grantRole(keccak256("TIP_MANAGER"), address(slash));

        // slash-tip needs user registry manager role in order to update allowance
        registry.grantRole(keccak256("USER_REGISTRY_MANAGER"), address(slash));

        vm.stopBroadcast();
    }
}
