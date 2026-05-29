// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";

contract DeployAndDemo is Script {
    // ───────── Config ─────────
    address public deployer;
    ToroRegistry public registry;

    // ───────── Batch Data ─────────
    bytes32 public constant BATCH_1 = "WILD-CATCH-001";
    bytes32 public constant BATCH_2 = "WILD-CATCH-002";
    bytes32 public constant BATCH_3 = "FARM-001";
    bytes32 public constant BATCH_4 = "FARM-002";

    bytes32 public constant LOT_1 = "TORO-01";
    bytes32 public constant LOT_2 = "TORO-02";

    function setUp() public {
        deployer = vm.rememberKey(vm.envUint("DEV_PRIVATE_KEY"));
        console2.log("Deployer:", deployer);
    }

    function run() external {
        vm.startBroadcast(deployer);

        // ─── Deploy ───
        console2.log("=== Deploying ToroRegistry ===");
        registry = new ToroRegistry();
        console2.log("ToroRegistry:", address(registry));

        // ─── Auth (dev: all deployer) ───
        registry.addFactorySigner(deployer);
        registry.authorizeStation(deployer);

        // ─── Trace 1: WILD-001 → TORO-01 (single batch, Bình Định) ───
        console2.log("");
        console2.log("=== TRACE 1: WILD-CATCH-001 -> TORO-01 ===");
        registry.mintBatch(BATCH_1, _sourceData(1, 1, "B\xc3\xacnh \xc4\x90\xe1\xbb\x8bnh", 1715731200, 1, 1, 800));
        registry.recordInventory(BATCH_1, _inventoryData(1716000000, 1));
        registry.recordManufacturing(BATCH_1, _manufData("TORO-Seafood Processing 1", 1717200000, 1718400000, 1950, 3900, 50));
        registry.createProductLot(LOT_1, _toArray(BATCH_1), 3900, _lotData("c\xc3\xa1 ng\xe1\xbb\xab \xc4\x91\xc3\xb3ng h\xe1\xbb\x99p", 1719800000));
        registry.recordWarehouse(LOT_1, _warehouseData("TORO-Cold Storage 1", 1719000000, 1719700000, 2));
        registry.recordDistribution(LOT_1, _distData("TORO-Shipping 1", 1719500000, 1719700000));

        // ─── Trace 2: WILD-002 + FARM-001 → TORO-02 (merge, Phú Yên + Khánh Hòa) ───
        console2.log("");
        console2.log("=== TRACE 2: WILD-CATCH-002 + FARM-001 -> TORO-02 ===");
        registry.mintBatch(BATCH_2, _sourceData(1, 1, "Ph\xc3\xba Y\xc3\xaan", 1715800000, 1, 1, 850));
        registry.recordInventory(BATCH_2, _inventoryData(1716100000, 1));
        registry.recordManufacturing(BATCH_2, _manufData("TORO-Seafood Processing 1", 1717300000, 1718500000, 2000, 4000, 60));

        registry.mintBatch(BATCH_3, _sourceData(2, 1, "Kh\xc3\xa1nh H\xc3\xb2a", 1715900000, 5, 1, 2500));
        registry.recordInventory(BATCH_3, _inventoryData(1716200000, 2));
        registry.recordManufacturing(BATCH_3, _manufData("TORO-Seafood Processing 2", 1717400000, 1718600000, 2400, 4800, 80));

        registry.createProductLot(LOT_2, _toArray2(BATCH_2, BATCH_3), 8800, _lotData("c\xc3\xa1 ng\xe1\xbb\xab \xc4\x91\xc3\xb3ng h\xe1\xbb\x99p", 1720000000));
        registry.recordWarehouse(LOT_2, _warehouseData("TORO-Cold Storage 2", 1719100000, 1719800000, 2));
        registry.recordDistribution(LOT_2, _distData("TORO-Shipping 2", 1719600000, 1719800000));

        // ─── Trace 3: FARM-002 → TORO-03 (single batch, Bình Định) ───
        console2.log("");
        console2.log("=== TRACE 3: FARM-002 -> TORO-03 ===");
        registry.mintBatch(BATCH_4, _sourceData(2, 2, "B\xc3\xacnh \xc4\x90\xe1\xbb\x8bnh", 1716000000, 5, 2, 3000));
        registry.recordInventory(BATCH_4, _inventoryData(1716300000, 2));
        registry.recordManufacturing(BATCH_4, _manufData("TORO-Seafood Processing 3", 1717500000, 1718700000, 2900, 5800, 100));
        bytes32 lot3 = "TORO-03";
        registry.createProductLot(lot3, _toArray(BATCH_4), 5800, _lotData("c\xc3\xa1 ng\xe1\xbb\xab \xc4\x91\xc3\xb3ng h\xe1\xbb\x99p", 1720100000));
        registry.recordWarehouse(lot3, _warehouseData("TORO-Cold Storage 1", 1719300000, 1720000000, 1));
        registry.recordDistribution(lot3, _distData("TORO-Shipping 3", 1719800000, 1720000000));

        // ─── Trace 4: WILD-003 → TORO-04 (Phú Yên) ───
        console2.log("");
        console2.log("=== TRACE 4: WILD-CATCH-003 -> TORO-04 ===");
        bytes32 batch5 = "WILD-CATCH-003";
        registry.mintBatch(batch5, _sourceData(1, 3, "Ph\xc3\xba Y\xc3\xaan", 1716100000, 2, 1, 1200));
        registry.recordInventory(batch5, _inventoryData(1716400000, 1));
        registry.recordManufacturing(batch5, _manufData("TORO-Seafood Processing 1", 1717600000, 1718800000, 1150, 2300, 40));
        bytes32 lot4 = "TORO-04";
        registry.createProductLot(lot4, _toArray(batch5), 2300, _lotData("c\xc3\xa1 ng\xe1\xbb\xab", 1720200000));
        registry.recordWarehouse(lot4, _warehouseData("TORO-Cold Storage 3", 1719400000, 1719900000, 3));
        registry.recordDistribution(lot4, _distData("TORO-Shipping 1", 1719900000, 1720100000));

        vm.stopBroadcast();

        // ─── Final Summary ───
        console2.log("");
        console2.log("========================================");
        console2.log("DEPLOYMENT & DEMO COMPLETE");
        console2.log("========================================");
        console2.log("ToroRegistry:", address(registry));
        console2.log("========================================");
    }

    // ───────── Data Builders ─────────

    function _sourceData(
        uint256 sourceType,
        uint256 species,
        string memory region,
        uint256 catchDate,
        uint256 method,
        uint256 area,
        uint256 weightKg
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](8);
        codes[0] = 0x100;
        codes[1] = 0x101;
        codes[2] = 0x102;
        codes[3] = 0x103;
        codes[4] = 0x104;
        codes[5] = 0x105;
        codes[6] = 0x106;
        codes[7] = 0x600;

        bytes32[] memory values = new bytes32[](8);
        values[0] = bytes32(sourceType);
        values[1] = bytes32(species);
        values[2] = _str32(region);
        values[3] = bytes32(catchDate);
        values[4] = bytes32(method);
        values[5] = bytes32(area);
        values[6] = bytes32(weightKg);
        values[7] = bytes32(uint256(1));

        return abi.encode(codes, values);
    }

    function _inventoryData(uint256 receivedDate, uint256 locationId) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](2);
        codes[0] = 0x110;
        codes[1] = 0x111;

        bytes32[] memory values = new bytes32[](2);
        values[0] = bytes32(receivedDate);
        values[1] = bytes32(locationId);

        return abi.encode(codes, values);
    }

    function _manufData(
        string memory factoryName,
        uint256 prodDate,
        uint256 packDate,
        uint256 inputKg,
        uint256 outputCans,
        uint256 wastageKg
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](6);
        codes[0] = 0x200;
        codes[1] = 0x204;
        codes[2] = 0x205;
        codes[3] = 0x208;
        codes[4] = 0x209;
        codes[5] = 0x20A;

        bytes32[] memory values = new bytes32[](6);
        values[0] = _str32(factoryName);
        values[1] = bytes32(prodDate);
        values[2] = bytes32(packDate);
        values[3] = bytes32(inputKg);
        values[4] = bytes32(outputCans);
        values[5] = bytes32(wastageKg);

        return abi.encode(codes, values);
    }

    function _lotData(string memory productLabel, uint256 packagingDate) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](2);
        codes[0] = 0x501;
        codes[1] = 0x504;

        bytes32[] memory values = new bytes32[](2);
        values[0] = _str32(productLabel);
        values[1] = bytes32(packagingDate);

        return abi.encode(codes, values);
    }

    function _warehouseData(
        string memory warehouseName,
        uint256 storageStart,
        uint256 storageEnd,
        int256 tempC
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](4);
        codes[0] = 0x300;
        codes[1] = 0x304;
        codes[2] = 0x305;
        codes[3] = 0x306;

        bytes32[] memory values = new bytes32[](4);
        values[0] = _str32(warehouseName);
        values[1] = bytes32(storageStart);
        values[2] = bytes32(storageEnd);
        values[3] = bytes32(uint256(int256(tempC)));

        return abi.encode(codes, values);
    }

    function _distData(
        string memory shipmentCode,
        uint256 departure,
        uint256 arrival
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](3);
        codes[0] = 0x400;
        codes[1] = 0x404;
        codes[2] = 0x405;

        bytes32[] memory values = new bytes32[](3);
        values[0] = _str32(shipmentCode);
        values[1] = bytes32(departure);
        values[2] = bytes32(arrival);

        return abi.encode(codes, values);
    }

    // Helper: convert string to right-aligned bytes32
    function _str32(string memory s) internal pure returns (bytes32) {
        return bytes32(bytes(s));
    }

    // ───────── Helpers ─────────

    function _toArray(bytes32 a) internal pure returns (bytes32[] memory arr) {
        arr = new bytes32[](1);
        arr[0] = a;
    }

    function _toArray2(bytes32 a, bytes32 b) internal pure returns (bytes32[] memory arr) {
        arr = new bytes32[](2);
        arr[0] = a;
        arr[1] = b;
    }
}
