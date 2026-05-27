// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";

contract DeployToro is Script {
    function run() external returns (ToroRegistry) {
        vm.startBroadcast();
        ToroRegistry registry = new ToroRegistry();
        vm.stopBroadcast();
        console2.log("ToroRegistry deployed at:", address(registry));
        return registry;
    }
}
