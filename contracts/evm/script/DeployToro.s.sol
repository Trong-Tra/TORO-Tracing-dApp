// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";

contract DeployToro is Script {
    function run() external returns (ToroRegistry) {
        vm.startBroadcast();
        ToroRegistry registry = new ToroRegistry();
        vm.stopBroadcast();
        return registry;
    }
}
