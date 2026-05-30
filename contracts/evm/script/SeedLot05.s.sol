// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";

contract SeedLot05 is Script {
    address public deployer;
    ToroRegistry public registry = ToroRegistry(payable(0x2119161E3f789E7946F7aCAe8516C63Db8a57077));

    function setUp() public {
        deployer = vm.rememberKey(vm.envUint("DEV_PRIVATE_KEY"));
        console2.log("Deployer:", deployer);
    }

    function run() external {
        vm.startBroadcast(deployer);

        bytes32 batch5 = "WILD-CATCH-005";
        bytes32 lot5   = "TORO-05";

        console2.log("=== Seeding TORO-05 ===");

        // Source: Wild catch, Bình Định, 22/05/2024
        registry.mintBatch(batch5, _sourceData(1, 1, "B\xc3\xacnh \xc4\x90\xe1\xbb\x8bnh", 1716336000, 1, 1, 1500));
        // Inventory: received 25/05/2024
        registry.recordInventory(batch5, _inventoryData(1716595200, 1));
        // Manufacturing: Processing 1, prod 10/06, pack 20/06
        registry.recordManufacturing(batch5, _manufData("TORO-Seafood Processing 1", 1717977600, 1718841600, 1450, 2900, 45));
        // Create lot: canned tuna, packaged 25/06
        registry.createProductLot(lot5, _toArray(batch5), 2900, _lotData("c\xc3\xa1 ng\xe1\xbb\xab \xc4\x91\xc3\xb3ng h\xe1\xbb\x99p", 1719273600));
        // Warehouse: Cold Storage 2, 20/06 -> 28/06, -2°C
        registry.recordWarehouse(lot5, _warehouseData("TORO-Cold Storage 2", 1718841600, 1719532800, -2));
        // Distribution: Shipping 2, depart 28/06, arrive 30/06
        registry.recordDistribution(lot5, _distData("TORO-Shipping 2", 1719532800, 1719705600));

        vm.stopBroadcast();

        console2.log("TORO-05 seeded successfully");
    }

    function _sourceData(uint256 sourceType, uint256 species, string memory region, uint256 catchDate, uint256 method, uint256 area, uint256 weightKg) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](8);
        codes[0] = 0x100; codes[1] = 0x101; codes[2] = 0x102; codes[3] = 0x103;
        codes[4] = 0x104; codes[5] = 0x105; codes[6] = 0x106; codes[7] = 0x600;
        bytes32[] memory values = new bytes32[](8);
        values[0] = bytes32(sourceType); values[1] = bytes32(species);
        values[2] = _str32(region); values[3] = bytes32(catchDate);
        values[4] = bytes32(method); values[5] = bytes32(area);
        values[6] = bytes32(weightKg); values[7] = bytes32(uint256(1));
        return abi.encode(codes, values);
    }

    function _inventoryData(uint256 receivedDate, uint256 locationId) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](2);
        codes[0] = 0x110; codes[1] = 0x111;
        bytes32[] memory values = new bytes32[](2);
        values[0] = bytes32(receivedDate); values[1] = bytes32(locationId);
        return abi.encode(codes, values);
    }

    function _manufData(string memory factoryName, uint256 prodDate, uint256 packDate, uint256 inputKg, uint256 outputCans, uint256 wastageKg) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](6);
        codes[0] = 0x200; codes[1] = 0x204; codes[2] = 0x205;
        codes[3] = 0x208; codes[4] = 0x209; codes[5] = 0x20A;
        bytes32[] memory values = new bytes32[](6);
        values[0] = _str32(factoryName); values[1] = bytes32(prodDate);
        values[2] = bytes32(packDate); values[3] = bytes32(inputKg);
        values[4] = bytes32(outputCans); values[5] = bytes32(wastageKg);
        return abi.encode(codes, values);
    }

    function _lotData(string memory productLabel, uint256 packagingDate) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](2);
        codes[0] = 0x501; codes[1] = 0x504;
        bytes32[] memory values = new bytes32[](2);
        values[0] = _str32(productLabel); values[1] = bytes32(packagingDate);
        return abi.encode(codes, values);
    }

    function _warehouseData(string memory warehouseName, uint256 storageStart, uint256 storageEnd, int256 tempC) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](4);
        codes[0] = 0x300; codes[1] = 0x304; codes[2] = 0x305; codes[3] = 0x306;
        bytes32[] memory values = new bytes32[](4);
        values[0] = _str32(warehouseName); values[1] = bytes32(storageStart);
        values[2] = bytes32(storageEnd); values[3] = bytes32(uint256(int256(tempC)));
        return abi.encode(codes, values);
    }

    function _distData(string memory shipmentCode, uint256 departure, uint256 arrival) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](3);
        codes[0] = 0x400; codes[1] = 0x404; codes[2] = 0x405;
        bytes32[] memory values = new bytes32[](3);
        values[0] = _str32(shipmentCode); values[1] = bytes32(departure); values[2] = bytes32(arrival);
        return abi.encode(codes, values);
    }

    function _str32(string memory s) internal pure returns (bytes32) {
        return bytes32(bytes(s));
    }

    function _toArray(bytes32 a) internal pure returns (bytes32[] memory arr) {
        arr = new bytes32[](1); arr[0] = a;
    }
}
