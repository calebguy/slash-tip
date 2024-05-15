// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {Tip} from "../src/contracts/Tip.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";
import {Script, console} from "forge-std/Script.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() external {
        string memory baseURI = "https://example.com/tokens/";
        uint256 deployer = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployer);

        address admin = 0x18F33CEf45817C428d98C4E188A770191fDD4B79;

        UserRegistry registry = new UserRegistry(admin, "/users");
        Tip tip = new Tip(admin, baseURI);
        SlashTip slash = new SlashTip(admin, address(registry), address(tip), "/tip");
    
        // slash-tip needs tip manager role in order to mint
        tip.grantRole(keccak256("TIP_MANAGER"), address(slash));

        // slash-tip needs user registry manager role in order to update allowance
        registry.grantRole(keccak256("USER_REGISTRY_MANAGER"), address(slash));

        vm.stopBroadcast();
    }
}
