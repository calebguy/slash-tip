// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {DeprecatedSlashTip} from "../src/contracts/DeprecatedSlashTip.sol";
import {DeprecatedTip} from "../src/contracts/DeprecatedTip.sol";
import {DeprecatedUserRegistry} from "../src/contracts/DeprecatedUserRegistry.sol";

/// @notice DEPRECATED: This deploys legacy V1 contracts. Use DeployV2.s.sol instead.
contract DeprecatedDeployNewSlashTip is Script {
    function setUp() public {}

    function run() external {
        uint256 deployer = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployer);

        address userRegistryAddress = 0x40bfEc5DEe98beba33C9d3eac8991b6d0c694B2d;

        address relayerAddress = 0xE7129298AE18FD2f4862E9a25D40CE333b11c583;
        address adminAddress = 0x18F33CEf45817C428d98C4E188A770191fDD4B79;
        address tipAddress = 0xA19e91f5c794BBe0632cC14bB51Db434573246e2;

        DeprecatedTip tip = DeprecatedTip(tipAddress);

        // DeprecatedUserRegistry userRegistry = new DeprecatedUserRegistry(adminAddress, "/users");

        DeprecatedSlashTip slash = new DeprecatedSlashTip(adminAddress, userRegistryAddress, tipAddress, "/tip");
        slash.grantRole(keccak256("SLASH_TIP_MANAGER"), relayerAddress);
        tip.grantRole(keccak256("TIP_MANAGER"), address(slash));
        // userRegistry.grantRole(keccak256("USER_REGISTRY_MANAGER"), relayerAddress);
        // Add users to UserRegistry
        // kristen
        // userRegistry.addUser(
        //     "U06LPBU6A02",
        //     UserRegistry.User({
        //         id: "U06LPBU6A02",
        //         nickname: "kristen",
        //         account: 0x8A05fA58d533a6e40C4381E3247Cf4c68ca61cdc,
        //         allowance: 491
        //     })
        // );
        // // sam
        // userRegistry.addUser(
        //     "U04SXK2ADK3",
        //     UserRegistry.User({
        //         id: "U04SXK2ADK3",
        //         nickname: "sam",
        //         account: 0x2aE5f36C77A736f76d61F3eEC06F12CAF2963fD6,
        //         allowance: 82
        //     })
        // );
        // // eric
        // userRegistry.addUser(
        //     "U04T5FRG264",
        //     UserRegistry.User({
        //         id: "U04T5FRG264",
        //         nickname: "eric",
        //         account: 0x4834a3c778F2d005B28a18c68d580Cc7F68c5Cbf,
        //         allowance: 269
        //     })
        // );
        // // daniil
        // userRegistry.addUser(
        //     "U05PERZL30W",
        //     UserRegistry.User({
        //         id: "U05PERZL30W",
        //         nickname: "daniil",
        //         account: 0x753f114DBbEed6070Db207EBc3f46cB3A106b1Ed,
        //         allowance: 556
        //     })
        // );
        // // kristina
        // userRegistry.addUser(
        //     "U074409GE4U",
        //     UserRegistry.User({
        //         id: "U074409GE4U",
        //         nickname: "kristina",
        //         account: 0x4F51804657F44386e4f67A6533fFC96390Dc45fC,
        //         allowance: 19
        //     })
        // );
        // // isaac
        // userRegistry.addUser(
        //     "U04BAKQB7RQ",
        //     UserRegistry.User({
        //         id: "U04BAKQB7RQ",
        //         nickname: "isaac",
        //         account: 0x7127d349A11D93C49D4E604167b1F7ff6aCfFFee,
        //         allowance: 52
        //     })
        // );
        // // justin
        // userRegistry.addUser(
        //     "U0320MF9BAT",
        //     UserRegistry.User({
        //         id: "U0320MF9BAT",
        //         nickname: "justin",
        //         account: 0xd2Cb3CcC522B5D36A20334d101791eb3C3384281,
        //         allowance: 576
        //     })
        // );
        // // gus
        // userRegistry.addUser(
        //     "U03R5TZPCHM",
        //     UserRegistry.User({
        //         id: "U03R5TZPCHM",
        //         nickname: "gus",
        //         account: 0xBabe638215bBdD667E1bf86F27509E10896c96a6,
        //         allowance: 565
        //     })
        // );
        // // will
        // userRegistry.addUser(
        //     "U041LLJ8CS3",
        //     UserRegistry.User({
        //         id: "U041LLJ8CS3",
        //         nickname: "will",
        //         account: 0x3Cbd57dA2F08b3268da07E5C9038C11861828637,
        //         allowance: 580
        //     })
        // );
        // // caleb
        // userRegistry.addUser(
        //     "U05LE52HUJW",
        //     UserRegistry.User({
        //         id: "U05LE52HUJW",
        //         nickname: "caleb",
        //         account: 0x18F33CEf45817C428d98C4E188A770191fDD4B79,
        //         allowance: 33
        //     })
        // );
        // // raihan
        // userRegistry.addUser(
        //     "U07G9NS9TUJ",
        //     UserRegistry.User({
        //         id: "U07G9NS9TUJ",
        //         nickname: "raihan",
        //         account: 0xb683A2056526162C4771d363204aF41ea8c1eC52,
        //         allowance: 352
        //     })
        // );
        // // pranav
        // userRegistry.addUser(
        //     "U085B6YT21Y",
        //     UserRegistry.User({
        //         id: "U085B6YT21Y",
        //         nickname: "pranav",
        //         account: 0x809e0633652448c3539069A4fE764aAcEEa3d8F7,
        //         allowance: 185
        //     })
        // );
        // // sushen
        // userRegistry.addUser(
        //     "U08386WP9BN",
        //     UserRegistry.User({
        //         id: "U08386WP9BN",
        //         nickname: "sushen",
        //         account: 0x4D8D2DDC4560252AE2EdefbaAa6Dd12144155014,
        //         allowance: 144
        //     })
        // );
        // // oleksii
        // userRegistry.addUser(
        //     "U08DHAZ7QMN",
        //     UserRegistry.User({
        //         id: "U08DHAZ7QMN",
        //         nickname: "oleksii",
        //         account: 0x6fB163354624AF5fb32c671762A8b6f556043D10,
        //         allowance: 69
        //     })
        // );
        // // jorge
        // userRegistry.addUser(
        //     "U07PY9SH2HY",
        //     UserRegistry.User({
        //         id: "U07PY9SH2HY",
        //         nickname: "jorge",
        //         account: 0xe127d5EB82A055412B536B6CfA81cE14FAa5D8cE,
        //         allowance: 24
        //     })
        // );
        vm.stopBroadcast();
    }
}
