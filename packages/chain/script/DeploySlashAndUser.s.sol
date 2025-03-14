// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {UserRegistry} from "../src/contracts/UserRegistry.sol";
import {Tip} from "../src/contracts/Tip.sol";
import {SlashTip} from "../src/contracts/SlashTip.sol";
import {Script, console} from "forge-std/Script.sol";

contract DeploySlashAndUser is Script {
    function setUp() public {}

    function run() external {
        uint256 deployer = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployer);

        address admin = 0x18F33CEf45817C428d98C4E188A770191fDD4B79;
        address tipAddress = 0xA19e91f5c794BBe0632cC14bB51Db434573246e2;

        UserRegistry registry = new UserRegistry(admin, "/users");
        SlashTip slash = new SlashTip(admin, address(registry), tipAddress, "/tip");
    
        // slash-tip needs user registry manager role in order to update allowance
        registry.grantRole(keccak256("USER_REGISTRY_MANAGER"), address(slash));

        // @todo grant slash tip manager on the tip token
        vm.stopBroadcast();
    }
}
