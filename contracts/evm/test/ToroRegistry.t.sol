// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";

contract ToroRegistryTest is Test {
    address public owner = address(1);
    address public factorySigner = address(2);
    address public station = address(3);
    address public stranger = address(4);

    ToroRegistry public registry;

    bytes32 public constant BATCH_1 = keccak256("WILD-CATCH-001");
    bytes32 public constant BATCH_2 = keccak256("FARM-001");
    bytes32 public constant LOT_1 = keccak256("TORO-LOT-001");

    function setUp() public {
        vm.warp(1_700_000_000);
        vm.prank(owner);
        registry = new ToroRegistry();

        vm.prank(owner);
        registry.addFactorySigner(factorySigner);

        vm.prank(owner);
        registry.authorizeStation(station);
    }

    function _encodeTrace(uint256[] memory codes, bytes32[] memory values) internal pure returns (bytes memory) {
        return abi.encode(codes, values);
    }

    function _dummyData() internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](1);
        codes[0] = 0x100;
        bytes32[] memory values = new bytes32[](1);
        values[0] = bytes32(uint256(1));
        return _encodeTrace(codes, values);
    }

    // ───────── Access Control ─────────

    function test_StrangerCannotMintBatch() public {
        vm.prank(stranger);
        vm.expectRevert(ToroRegistry.Unauthorized.selector);
        registry.mintBatch(BATCH_1, _dummyData());
    }

    function test_StrangerCannotRecordInventory() public {
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_1, _dummyData());

        vm.prank(stranger);
        vm.expectRevert(ToroRegistry.Unauthorized.selector);
        registry.recordInventory(BATCH_1, _dummyData());
    }

    function test_StrangerCannotCreateLot() public {
        vm.prank(stranger);
        vm.expectRevert(ToroRegistry.Unauthorized.selector);
        registry.createProductLot(LOT_1, new bytes32[](0), 1000, _dummyData());
    }

    // ───────── Full Single Batch Flow ─────────

    function test_FullSingleBatchFlow() public {
        // 1. Mint
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_1, _dummyData());
        assertEq(registry.batchStage(BATCH_1), 1);

        // 2. Inventory
        vm.prank(station);
        registry.recordInventory(BATCH_1, _dummyData());
        assertEq(registry.batchStage(BATCH_1), 2);

        // 3. Manufacturing
        vm.prank(station);
        registry.recordManufacturing(BATCH_1, _dummyData());
        assertEq(registry.batchStage(BATCH_1), 3);

        // 4. Create lot
        bytes32[] memory batches = new bytes32[](1);
        batches[0] = BATCH_1;
        vm.prank(factorySigner);
        registry.createProductLot(LOT_1, batches, 3900, _dummyData());
        assertTrue(registry.lotStage(LOT_1) == 3);
        assertEq(registry.getLotInputBatches(LOT_1).length, 1);
        assertEq(registry.getLotInputBatches(LOT_1)[0], BATCH_1);

        // 5. Warehouse
        vm.prank(station);
        registry.recordWarehouse(LOT_1, _dummyData());
        assertEq(registry.lotStage(LOT_1), 4);

        // 6. Distribution
        vm.prank(station);
        registry.recordDistribution(LOT_1, _dummyData());
        assertEq(registry.lotStage(LOT_1), 5);
    }

    // ───────── Merge Flow ─────────

    function test_MergeTwoBatches() public {
        // Batch 1
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_1, _dummyData());
        vm.prank(station);
        registry.recordInventory(BATCH_1, _dummyData());
        vm.prank(station);
        registry.recordManufacturing(BATCH_1, _dummyData());

        // Batch 2
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_2, _dummyData());
        vm.prank(station);
        registry.recordInventory(BATCH_2, _dummyData());
        vm.prank(station);
        registry.recordManufacturing(BATCH_2, _dummyData());

        // Merge
        bytes32[] memory batches = new bytes32[](2);
        batches[0] = BATCH_1;
        batches[1] = BATCH_2;
        vm.prank(factorySigner);
        registry.createProductLot(LOT_1, batches, 8800, _dummyData());

        assertEq(registry.lotStage(LOT_1), 3);
        assertEq(registry.getLotInputBatches(LOT_1).length, 2);
    }

    // ───────── Stage Enforcement ─────────

    function test_CannotSkipInventory() public {
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_1, _dummyData());

        vm.prank(station);
        vm.expectRevert(ToroRegistry.InvalidStage.selector);
        registry.recordManufacturing(BATCH_1, _dummyData());
    }

    function test_CannotCreateLotWithUnmanufacturedBatch() public {
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_1, _dummyData());

        bytes32[] memory batches = new bytes32[](1);
        batches[0] = BATCH_1;
        vm.prank(factorySigner);
        vm.expectRevert(ToroRegistry.BatchNotAtManufacturing.selector);
        registry.createProductLot(LOT_1, batches, 1000, _dummyData());
    }

    function test_CannotRecordWarehouseBeforeLotCreated() public {
        vm.prank(station);
        vm.expectRevert(ToroRegistry.InvalidStage.selector);
        registry.recordWarehouse(LOT_1, _dummyData());
    }

    function test_CannotRecordDistributionBeforeWarehouse() public {
        bytes32[] memory batches = new bytes32[](0);
        vm.prank(factorySigner);
        registry.createProductLot(LOT_1, batches, 1000, _dummyData());

        vm.prank(station);
        vm.expectRevert(ToroRegistry.InvalidStage.selector);
        registry.recordDistribution(LOT_1, _dummyData());
    }

    // ───────── Duplicate Prevention ─────────

    function test_CannotMintSameBatchTwice() public {
        vm.prank(factorySigner);
        registry.mintBatch(BATCH_1, _dummyData());

        vm.prank(factorySigner);
        vm.expectRevert(ToroRegistry.BatchExists.selector);
        registry.mintBatch(BATCH_1, _dummyData());
    }

    function test_CannotCreateSameLotTwice() public {
        bytes32[] memory batches = new bytes32[](0);
        vm.prank(factorySigner);
        registry.createProductLot(LOT_1, batches, 1000, _dummyData());

        vm.prank(factorySigner);
        vm.expectRevert(ToroRegistry.LotExists.selector);
        registry.createProductLot(LOT_1, batches, 1000, _dummyData());
    }
}
