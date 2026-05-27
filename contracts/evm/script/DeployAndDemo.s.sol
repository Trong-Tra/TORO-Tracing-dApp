// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ToroSBT} from "../src/ToroSBT.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";
import {ToroFactory} from "../src/ToroFactory.sol";
import {ToroStation} from "../src/ToroStation.sol";
import {ToroRecordMinter} from "../src/ToroRecordMinter.sol";

contract DeployAndDemo is Script {
    // ───────── Config ─────────
    address public deployer;

    // ───────── Deployed Contracts ─────────
    ToroSBT public sbt;
    ToroRegistry public registry;
    ToroFactory public factory;
    ToroStation public stationSource;
    ToroStation public stationManuf;
    ToroStation public stationWarehouse;
    ToroStation public stationDist;
    ToroRecordMinter public recordMinter;

    // ───────── Batch Data ─────────
    bytes32 public constant BATCH_1 = keccak256("WILD-CATCH-001");
    bytes32 public constant BATCH_2 = keccak256("WILD-CATCH-002");
    bytes32 public constant BATCH_3 = keccak256("FARM-001");
    bytes32 public constant BATCH_4 = keccak256("FARM-002");

    bytes32 public constant LOT_1 = keccak256("TORO-LOT-001");
    bytes32 public constant LOT_2 = keccak256("TORO-LOT-002");

    // ───────── Stage Constants ─────────
    uint8 public constant STAGE_SOURCE = 0;
    uint8 public constant STAGE_MANUF = 1;
    uint8 public constant STAGE_WAREHOUSE = 2;
    uint8 public constant STAGE_DIST = 3;
    uint8 public constant STAGE_FINAL = 4;

    function setUp() public {
        deployer = vm.rememberKey(vm.envUint("DEV_PRIVATE_KEY"));
        console2.log("Deployer:", deployer);
    }

    function run() external {
        vm.startBroadcast(deployer);

        // ─── Deploy Core ───
        console2.log("=== Deploying ToroSBT ===");
        sbt = new ToroSBT();
        console2.log("ToroSBT:", address(sbt));

        console2.log("=== Deploying ToroRegistry ===");
        registry = new ToroRegistry();
        console2.log("ToroRegistry:", address(registry));

        console2.log("=== Deploying ToroFactory ===");
        factory = new ToroFactory(address(sbt), address(registry));
        console2.log("ToroFactory:", address(factory));

        console2.log("=== Deploying ToroRecordMinter ===");
        recordMinter = new ToroRecordMinter(address(sbt), address(registry));
        console2.log("ToroRecordMinter:", address(recordMinter));

        // ─── Wire up SBT ───
        sbt.setRecordMinter(address(recordMinter));
        sbt.transferFactoryOwnership(address(factory));

        // ─── Authorize recorders in Registry ───
        registry.authorizeRecorder(address(factory));
        registry.authorizeRecorder(address(recordMinter));

        // ─── Deploy Stations ───
        console2.log("=== Deploying Stations ===");
        stationSource = new ToroStation(address(sbt), address(registry));
        stationManuf = new ToroStation(address(sbt), address(registry));
        stationWarehouse = new ToroStation(address(sbt), address(registry));
        stationDist = new ToroStation(address(sbt), address(registry));

        console2.log("Station Source:", address(stationSource));
        console2.log("Station Manuf:", address(stationManuf));
        console2.log("Station Warehouse:", address(stationWarehouse));
        console2.log("Station Dist:", address(stationDist));

        // ─── Authorize stations via Factory ───
        factory.authorizeStation(address(stationSource));
        factory.authorizeStation(address(stationManuf));
        factory.authorizeStation(address(stationWarehouse));
        factory.authorizeStation(address(stationDist));

        // ─── Add signers (all deployer for dev) ───
        factory.addFactorySigner(deployer);
        stationSource.addSigner(deployer);
        stationManuf.addSigner(deployer);
        stationWarehouse.addSigner(deployer);
        stationDist.addSigner(deployer);
        recordMinter.addRecordSigner(deployer);

        // ─── Trace 1: Wild Catch 1 → Single batch product ───
        console2.log("");
        console2.log("=== TRACE 1: WILD-CATCH-001 -> LOT-001 (single batch) ===");
        uint256 token1 = _runFullTrace(
            BATCH_1,
            _sourceData(1, 1, 704, 1715731200, 1, 1, 800),
            _manufData(1717200000, 1718400000, 1950, 3900, 50),
            _warehouseData(1719000000, 2, 72),
            _distData(1719500000, 1719700000, 48, 0),
            LOT_1,
            3900,
            1719800000
        );
        console2.log("Token 1 (WILD-001) finalized");

        // ─── Trace 2: Wild Catch 2 + Farm 1 → Merged product ───
        console2.log("");
        console2.log("=== TRACE 2: WILD-CATCH-002 + FARM-001 -> LOT-002 (merge) ===");
        uint256 token2 = _runFullTrace(
            BATCH_2,
            _sourceData(1, 1, 704, 1715800000, 1, 1, 850),
            _manufData(1717300000, 1718500000, 2000, 4000, 60),
            _warehouseData(1719100000, 2, 48),
            _distData(1719600000, 1719800000, 36, 0),
            bytes32(0), // no final yet
            0,
            0
        );

        uint256 token3 = _runFullTrace(
            BATCH_3,
            _sourceData(2, 1, 764, 1715900000, 5, 1, 2500),
            _manufData(1717400000, 1718600000, 2400, 4800, 80),
            _warehouseData(1719200000, 2, 48),
            _distData(1719700000, 1719900000, 36, 0),
            bytes32(0), // no final yet
            0,
            0
        );

        // Merge token2 + token3 into LOT_002
        uint256[] memory mergeIds = new uint256[](2);
        mergeIds[0] = token2;
        mergeIds[1] = token3;
        _finalizeMerge(mergeIds, LOT_2, 8800, 1720000000);
        console2.log("Token 2 + 3 merged into LOT-002");

        // ─── Trace 3: Farm 2 → Single batch product ───
        console2.log("");
        console2.log("=== TRACE 3: FARM-002 -> LOT-003 (single batch) ===");
        uint256 token4 = _runFullTrace(
            BATCH_4,
            _sourceData(2, 2, 764, 1716000000, 5, 2, 3000),
            _manufData(1717500000, 1718700000, 2900, 5800, 100),
            _warehouseData(1719300000, 1, 96),
            _distData(1719800000, 1720000000, 48, 1),
            keccak256("TORO-LOT-003"),
            5800,
            1720100000
        );
        console2.log("Token 4 (FARM-002) finalized");

        // ─── Trace 4: Another wild catch → Single batch ───
        console2.log("");
        console2.log("=== TRACE 4: WILD-CATCH-003 -> LOT-004 (single batch) ===");
        uint256 token5 = _runFullTrace(
            keccak256("WILD-CATCH-003"),
            _sourceData(1, 3, 360, 1716100000, 2, 1, 1200),
            _manufData(1717600000, 1718800000, 1150, 2300, 40),
            _warehouseData(1719400000, 3, 24),
            _distData(1719900000, 1720100000, 24, 0),
            keccak256("TORO-LOT-004"),
            2300,
            1720200000
        );
        console2.log("Token 5 (WILD-003) finalized");

        vm.stopBroadcast();

        // ─── Final Summary ───
        console2.log("");
        console2.log("========================================");
        console2.log("DEPLOYMENT & DEMO COMPLETE");
        console2.log("========================================");
        console2.log("ToroSBT:", address(sbt));
        console2.log("ToroRegistry:", address(registry));
        console2.log("ToroFactory:", address(factory));
        console2.log("ToroRecordMinter:", address(recordMinter));
        console2.log("Station Source:", address(stationSource));
        console2.log("Station Manuf:", address(stationManuf));
        console2.log("Station Warehouse:", address(stationWarehouse));
        console2.log("Station Dist:", address(stationDist));
        console2.log("----------------------------------------");
        console2.log("Total minted:", sbt.totalMinted());
        console2.log("Token 1 frozen:", sbt.frozen(1));
        console2.log("Token 2 frozen:", sbt.frozen(2));
        console2.log("Token 3 frozen:", sbt.frozen(3));
        console2.log("Token 4 frozen:", sbt.frozen(4));
        console2.log("Token 5 frozen:", sbt.frozen(5));
    }

    // ───────── Internal Helpers ─────────

    function _runFullTrace(
        bytes32 batchId,
        bytes memory sourceData,
        bytes memory manufData,
        bytes memory warehouseData,
        bytes memory distData,
        bytes32 lotCode,
        uint256 totalCans,
        uint256 packagingDate
    ) internal returns (uint256 tokenId) {
        // Mint → Source
        (tokenId,) = factory.mintBatch(batchId, address(stationSource), sourceData);

        // Source → Manuf
        stationSource.evolve(tokenId, STAGE_MANUF, manufData, address(stationManuf));

        // Manuf → Warehouse
        stationManuf.evolve(tokenId, STAGE_WAREHOUSE, warehouseData, address(stationWarehouse));

        // Warehouse → Dist
        stationWarehouse.evolve(tokenId, STAGE_DIST, distData, address(stationDist));

        // Dist → Record Minter (pass without recording a new trace)
        stationDist.pass(tokenId, address(recordMinter));

        // Finalize if lotCode is set
        if (lotCode != bytes32(0)) {
            uint256[] memory ids = new uint256[](1);
            ids[0] = tokenId;
            recordMinter.finalize(ids, totalCans, lotCode, packagingDate, _encodeSingleFinal());
        }
    }

    function _finalizeMerge(
        uint256[] memory tokenIds,
        bytes32 lotCode,
        uint256 totalCans,
        uint256 packagingDate
    ) internal {
        recordMinter.finalize(tokenIds, totalCans, lotCode, packagingDate, _encodeMergeFinal(tokenIds.length));
    }

    // ───────── Data Builders ─────────

    function _sourceData(
        uint256 sourceType,   // 1=vessel, 2=farm
        uint256 species,      // 1=yellowfin, 2=skipjack, 3=bigeye, 4=albacore
        uint256 country,      // ISO numeric
        uint256 catchDate,
        uint256 method,       // 1=longline, 2=purse seine, 3=pole & line, 4=gillnet, 5=aquaculture
        uint256 area,         // 1=pacific, 2=indian, 3=atlantic
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
        codes[7] = 0x600; // HACCP flag

        bytes32[] memory values = new bytes32[](8);
        values[0] = bytes32(sourceType);
        values[1] = bytes32(species);
        values[2] = bytes32(country);
        values[3] = bytes32(catchDate);
        values[4] = bytes32(method);
        values[5] = bytes32(area);
        values[6] = bytes32(weightKg);
        values[7] = bytes32(uint256(1)); // HACCP = true

        return abi.encode(codes, values);
    }

    function _manufData(
        uint256 prodDate,
        uint256 packDate,
        uint256 inputKg,
        uint256 outputCans,
        uint256 wastageKg
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](6);
        codes[0] = 0x200; // factory name hash (keccak256("TORO Seafood Factory"))
        codes[1] = 0x204;
        codes[2] = 0x205;
        codes[3] = 0x208;
        codes[4] = 0x209;
        codes[5] = 0x20A;

        bytes32[] memory values = new bytes32[](6);
        values[0] = keccak256("TORO Seafood Factory");
        values[1] = bytes32(prodDate);
        values[2] = bytes32(packDate);
        values[3] = bytes32(inputKg);
        values[4] = bytes32(outputCans);
        values[5] = bytes32(wastageKg);

        return abi.encode(codes, values);
    }

    function _warehouseData(
        uint256 storageDate,
        int256 tempC,
        uint256 durationHrs
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](4);
        codes[0] = 0x300;
        codes[1] = 0x304;
        codes[2] = 0x305;
        codes[3] = 0x306;

        bytes32[] memory values = new bytes32[](4);
        values[0] = keccak256("Singapore Cold Storage");
        values[1] = bytes32(storageDate);
        values[2] = bytes32(uint256(int256(tempC)));
        values[3] = bytes32(durationHrs);

        return abi.encode(codes, values);
    }

    function _distData(
        uint256 departure,
        uint256 arrival,
        uint256 durationHrs,
        int256 tempC
    ) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](5);
        codes[0] = 0x400;
        codes[1] = 0x404;
        codes[2] = 0x405;
        codes[3] = 0x406;
        codes[4] = 0x409;

        bytes32[] memory values = new bytes32[](5);
        values[0] = keccak256("SHP-2026-0892");
        values[1] = bytes32(departure);
        values[2] = bytes32(arrival);
        values[3] = bytes32(durationHrs);
        values[4] = bytes32(uint256(int256(tempC)));

        return abi.encode(codes, values);
    }

    function _encodeSingleFinal() internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](1);
        codes[0] = 0x501;
        bytes32[] memory values = new bytes32[](1);
        values[0] = keccak256("TORO Premium Tuna");
        return abi.encode(codes, values);
    }

    function _encodeMergeFinal(uint256 batchCount) internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](2);
        codes[0] = 0x501;
        codes[1] = 0x503;
        bytes32[] memory values = new bytes32[](2);
        values[0] = keccak256("TORO Premium Tuna Blend");
        values[1] = bytes32(batchCount);
        return abi.encode(codes, values);
    }
}
