// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ToroSBT} from "../src/ToroSBT.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";
import {ToroFactory} from "../src/ToroFactory.sol";
import {ToroStation} from "../src/ToroStation.sol";
import {ToroRecordMinter} from "../src/ToroRecordMinter.sol";

contract DeployToro is Script {
    function run() external returns (ToroSBT, ToroRegistry, ToroFactory, ToroStation, ToroStation, ToroStation, ToroRecordMinter) {
        vm.startBroadcast();

        ToroSBT sbt = new ToroSBT();
        ToroRegistry registry = new ToroRegistry();
        ToroFactory factory = new ToroFactory(address(sbt), address(registry));
        ToroRecordMinter recordMinter = new ToroRecordMinter(address(sbt), address(registry));

        sbt.setRecordMinter(address(recordMinter));
        sbt.transferFactoryOwnership(address(factory));

        registry.authorizeRecorder(address(factory));
        registry.authorizeRecorder(address(recordMinter));

        ToroStation stationA = new ToroStation(address(sbt), address(registry));
        ToroStation stationB = new ToroStation(address(sbt), address(registry));
        ToroStation stationC = new ToroStation(address(sbt), address(registry));

        factory.authorizeStation(address(stationA));
        factory.authorizeStation(address(stationB));
        factory.authorizeStation(address(stationC));

        vm.stopBroadcast();

        return (sbt, registry, factory, stationA, stationB, stationC, recordMinter);
    }
}
