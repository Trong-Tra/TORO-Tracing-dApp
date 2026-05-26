// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";
import {ToroTypes} from "../src/ToroTypes.sol";

contract ToroRegistryTest is Test {
    ToroRegistry public registry;
    address public owner = address(1);
    address public operator = address(2);
    address public stranger = address(3);

    bytes32 constant BATCH_A = keccak256("FARM_BATCH_001");
    bytes32 constant BATCH_B = keccak256("CATCH_BATCH_001");

    function setUp() public {
        vm.warp(1_700_000_000); // large timestamp to avoid underflow in test data
        vm.prank(owner);
        registry = new ToroRegistry();
        vm.prank(owner);
        registry.addOperator(operator);
    }

    // ───────── Access Control ─────────

    function test_OwnerCanAddOperator() public {
        vm.prank(owner);
        registry.addOperator(stranger);
        assertTrue(registry.operators(stranger));
    }

    function test_StrangerCannotAddOperator() public {
        vm.prank(stranger);
        vm.expectRevert(ToroRegistry.Unauthorized.selector);
        registry.addOperator(stranger);
    }

    function test_StrangerCannotRecord() public {
        vm.prank(stranger);
        vm.expectRevert(ToroRegistry.Unauthorized.selector);
        registry.recordHatchery(_dummyHatchery(BATCH_A));
    }

    // ───────── Farm Chain ─────────

    function test_FullFarmChain() public {
        bytes32 txHatchery = _recordHatchery(BATCH_A);
        assertEq(registry.batchStageCount(BATCH_A), 1);
        assertEq(uint256(registry.recordStage(txHatchery)), uint256(ToroTypes.Stage.Hatchery));

        bytes32 txNursery = _recordNursery(BATCH_A, txHatchery);
        assertEq(registry.batchStageCount(BATCH_A), 2);

        bytes32 txGrowout = _recordGrowout(BATCH_A, txNursery);
        assertEq(registry.batchStageCount(BATCH_A), 3);

        bytes32 txHarvest = _recordHarvestTransport(BATCH_A, txGrowout);
        assertEq(registry.batchStageCount(BATCH_A), 4);

        bytes32 txFarmProcess = _recordFarmProcessing(BATCH_A, txHarvest);
        assertEq(registry.batchStageCount(BATCH_A), 5);

        // Verify latest stage hash
        assertEq(registry.getLatestStageHash(BATCH_A, ToroTypes.Stage.FarmProcessing), txFarmProcess);
    }

    function test_FarmChain_InvalidSequence() public {
        // Cannot record Nursery without Hatchery
        vm.prank(operator);
        vm.expectRevert(ToroRegistry.InvalidStageSequence.selector);
        registry.recordNursery(_dummyNursery(BATCH_A, bytes32(0)));
    }

    // ───────── Catch Chain ─────────

    function test_FullCatchChain() public {
        bytes32 txCatch = _recordCatchIce(BATCH_B);
        assertEq(registry.batchStageCount(BATCH_B), 1);

        bytes32 txPort = _recordPortLanding(BATCH_B, txCatch);
        assertEq(registry.batchStageCount(BATCH_B), 2);

        bytes32 txTransport = _recordTransportPlant(BATCH_B, txPort);
        assertEq(registry.batchStageCount(BATCH_B), 3);

        bytes32 txCatchProcess = _recordCatchProcessing(BATCH_B, txTransport);
        assertEq(registry.batchStageCount(BATCH_B), 4);

        assertEq(registry.getLatestStageHash(BATCH_B, ToroTypes.Stage.CatchProcessing), txCatchProcess);
    }

    // ───────── Final Product ─────────

    function test_FinalProduct_MergesBothChains() public {
        bytes32 txFarm = _recordHatchery(BATCH_A);
        txFarm = _recordNursery(BATCH_A, txFarm);
        txFarm = _recordGrowout(BATCH_A, txFarm);
        txFarm = _recordHarvestTransport(BATCH_A, txFarm);
        txFarm = _recordFarmProcessing(BATCH_A, txFarm);

        bytes32 txCatch = _recordCatchIce(BATCH_A);
        txCatch = _recordPortLanding(BATCH_A, txCatch);
        txCatch = _recordTransportPlant(BATCH_A, txCatch);
        txCatch = _recordCatchProcessing(BATCH_A, txCatch);

        vm.prank(operator);
        bytes32 txFinal = registry.recordFinalProduct(
            ToroTypes.FinalProduct({
                batchId: BATCH_A,
                prevTxHashA: txFarm,
                prevTxHashB: txCatch,
                totalCans: 5440,
                farmCans: 3900,
                catchCans: 1540,
                batchLabel: "TORO-001",
                packagingDate: block.timestamp,
                distributionCenter: "Bangkok"
            })
        );

        assertEq(registry.batchStageCount(BATCH_A), 10);
        assertEq(uint256(registry.recordStage(txFinal)), uint256(ToroTypes.Stage.FinalProduct));
    }

    function test_FinalProduct_RevertIfFarmMissing() public {
        bytes32 txCatch = _recordCatchIce(BATCH_A);
        txCatch = _recordPortLanding(BATCH_A, txCatch);
        txCatch = _recordTransportPlant(BATCH_A, txCatch);
        txCatch = _recordCatchProcessing(BATCH_A, txCatch);

        vm.prank(operator);
        vm.expectRevert(ToroRegistry.ChainNotReady.selector);
        registry.recordFinalProduct(
            ToroTypes.FinalProduct({
                batchId: BATCH_A,
                prevTxHashA: bytes32(0),
                prevTxHashB: txCatch,
                totalCans: 5440,
                farmCans: 3900,
                catchCans: 1540,
                batchLabel: "TORO-001",
                packagingDate: block.timestamp,
                distributionCenter: "Bangkok"
            })
        );
    }

    // ───────── Helpers ─────────

    function _dummyHatchery(bytes32 _batchId) internal view returns (ToroTypes.Hatchery memory) {
        return ToroTypes.Hatchery({
            batchId: _batchId,
            eggWeightKg: 500,
            hatcheryLocation: "Phuket",
            spawnDate: block.timestamp - 30 days,
            supplierProfileHash: keccak256("supplier")
        });
    }

    function _recordHatchery(bytes32 _batchId) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordHatchery(_dummyHatchery(_batchId));
    }

    function _dummyNursery(bytes32 _batchId, bytes32 _prev) internal pure returns (ToroTypes.Nursery memory) {
        return ToroTypes.Nursery({
            batchId: _batchId,
            prevTxHash: _prev,
            fryWeightKg: 450,
            survivalRatePct: 90,
            pondId: "POND-A1",
            feedTypeHash: keccak256("feed")
        });
    }

    function _recordNursery(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordNursery(_dummyNursery(_batchId, _prev));
    }

    function _dummyGrowout(bytes32 _batchId, bytes32 _prev) internal view returns (ToroTypes.Growout memory) {
        return ToroTypes.Growout({
            batchId: _batchId,
            prevTxHash: _prev,
            fishWeightKg: 2000,
            densityPerM3: 25,
            harvestDate: block.timestamp - 15 days,
            antibioticFreeCertHash: keccak256("cert")
        });
    }

    function _recordGrowout(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordGrowout(_dummyGrowout(_batchId, _prev));
    }

    function _dummyHarvestTransport(bytes32 _batchId, bytes32 _prev) internal view returns (ToroTypes.HarvestTransport memory) {
        return ToroTypes.HarvestTransport({
            batchId: _batchId,
            prevTxHash: _prev,
            shippedWeightKg: 1950,
            iceTempC: 0,
            truckId: "TRUCK-42",
            arrivalTime: block.timestamp - 7 days
        });
    }

    function _recordHarvestTransport(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordHarvestTransport(_dummyHarvestTransport(_batchId, _prev));
    }

    function _dummyFarmProcessing(bytes32 _batchId, bytes32 _prev) internal pure returns (ToroTypes.FarmProcessing memory) {
        return ToroTypes.FarmProcessing({
            batchId: _batchId,
            prevTxHash: _prev,
            inputWeightKg: 1950,
            outputCans: 3900,
            wastageKg: 50,
            supervisorId: keccak256("supervisorA")
        });
    }

    function _recordFarmProcessing(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordFarmProcessing(_dummyFarmProcessing(_batchId, _prev));
    }

    function _dummyCatchIce(bytes32 _batchId) internal view returns (ToroTypes.CatchIce memory) {
        return ToroTypes.CatchIce({
            batchId: _batchId,
            catchWeightKg: 800,
            catchLocationLatlonHash: keccak256("7.0,98.0"),
            fishingMethod: "Longline",
            vesselId: "VESSEL-01",
            catchDate: block.timestamp - 20 days
        });
    }

    function _recordCatchIce(bytes32 _batchId) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordCatchIce(_dummyCatchIce(_batchId));
    }

    function _dummyPortLanding(bytes32 _batchId, bytes32 _prev) internal pure returns (ToroTypes.PortLanding memory) {
        return ToroTypes.PortLanding({
            batchId: _batchId,
            prevTxHash: _prev,
            landedWeightKg: 780,
            portName: "Songkhla",
            coldStorageTemp: -2,
            qualityCertHash: keccak256("quality")
        });
    }

    function _recordPortLanding(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordPortLanding(_dummyPortLanding(_batchId, _prev));
    }

    function _dummyTransportPlant(bytes32 _batchId, bytes32 _prev) internal pure returns (ToroTypes.TransportPlant memory) {
        return ToroTypes.TransportPlant({
            batchId: _batchId,
            prevTxHash: _prev,
            shippedWeightKg: 770,
            containerId: "CONT-99",
            transitTimeHours: 12,
            storageConditionHash: keccak256("conditions")
        });
    }

    function _recordTransportPlant(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordTransportPlant(_dummyTransportPlant(_batchId, _prev));
    }

    function _dummyCatchProcessing(bytes32 _batchId, bytes32 _prev) internal pure returns (ToroTypes.CatchProcessing memory) {
        return ToroTypes.CatchProcessing({
            batchId: _batchId,
            prevTxHash: _prev,
            inputWeightKg: 770,
            outputCans: 1540,
            wastageKg: 10,
            supervisorId: keccak256("supervisorB")
        });
    }

    function _recordCatchProcessing(bytes32 _batchId, bytes32 _prev) internal returns (bytes32) {
        vm.prank(operator);
        return registry.recordCatchProcessing(_dummyCatchProcessing(_batchId, _prev));
    }
}
