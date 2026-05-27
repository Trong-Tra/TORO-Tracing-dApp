// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ToroSBT} from "../src/ToroSBT.sol";
import {ToroRegistry} from "../src/ToroRegistry.sol";
import {ToroFactory} from "../src/ToroFactory.sol";
import {ToroStation} from "../src/ToroStation.sol";
import {ToroRecordMinter} from "../src/ToroRecordMinter.sol";

contract ToroSystemTest is Test {
    // Roles
    address public owner = address(1);
    address public factorySigner = address(2);
    address public stationSignerA = address(3);
    address public stationSignerB = address(4);
    address public stationSignerC = address(5);
    address public recordSigner = address(6);
    address public stranger = address(7);

    // Contracts
    ToroSBT public sbt;
    ToroRegistry public registry;
    ToroFactory public factory;
    ToroStation public stationA;
    ToroStation public stationB;
    ToroStation public stationC;
    ToroRecordMinter public recordMinter;

    // Data helpers
    bytes32 public constant BATCH_1 = keccak256("WILD-CATCH-001");
    bytes32 public constant BATCH_2 = keccak256("FARM-001");
    bytes32 public constant LOT_CODE = keccak256("TORO-LOT-001");

    function setUp() public {
        vm.warp(1_700_000_000);

        // Deploy core contracts
        vm.prank(owner);
        sbt = new ToroSBT();

        vm.prank(owner);
        registry = new ToroRegistry();

        // Deploy factory
        vm.prank(owner);
        factory = new ToroFactory(address(sbt), address(registry));

        // Deploy record minter
        vm.prank(owner);
        recordMinter = new ToroRecordMinter(address(sbt), address(registry));

        // Wire up SBT (must happen before factory ownership transfer)
        vm.prank(owner);
        sbt.setRecordMinter(address(recordMinter));

        // Transfer factory ownership in SBT to the Factory contract
        vm.prank(owner);
        sbt.transferFactoryOwnership(address(factory));

        // Authorize factory and record minter in registry
        vm.prank(owner);
        registry.authorizeRecorder(address(factory));

        vm.prank(owner);
        registry.authorizeRecorder(address(recordMinter));

        // Deploy stations
        vm.prank(owner);
        stationA = new ToroStation(address(sbt), address(registry));

        vm.prank(owner);
        stationB = new ToroStation(address(sbt), address(registry));

        vm.prank(owner);
        stationC = new ToroStation(address(sbt), address(registry));

        // Authorize stations via factory
        vm.prank(owner);
        factory.authorizeStation(address(stationA));

        vm.prank(owner);
        factory.authorizeStation(address(stationB));

        vm.prank(owner);
        factory.authorizeStation(address(stationC));

        // Add signers
        vm.prank(owner);
        factory.addFactorySigner(factorySigner);

        vm.prank(owner);
        stationA.addSigner(stationSignerA);

        vm.prank(owner);
        stationB.addSigner(stationSignerB);

        vm.prank(owner);
        stationC.addSigner(stationSignerC);

        vm.prank(owner);
        recordMinter.addRecordSigner(recordSigner);
    }

    // ───────── Helpers ─────────

    function _encodeTrace(uint256[] memory codes, bytes32[] memory values) internal pure returns (bytes memory) {
        return abi.encode(codes, values);
    }

    function _dummySourceData() internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](3);
        codes[0] = 0x725; // fishing method: net catch
        codes[1] = 0x101; // species: yellowfin
        codes[2] = 0x201; // catch area: pacific

        bytes32[] memory values = new bytes32[](3);
        values[0] = bytes32(uint256(800)); // 800 kg
        values[1] = bytes32(uint256(1));
        values[2] = bytes32(uint256(1));

        return _encodeTrace(codes, values);
    }

    function _dummyManufData() internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](2);
        codes[0] = 0x301; // factory name hash
        codes[1] = 0x401; // haccp cert

        bytes32[] memory values = new bytes32[](2);
        values[0] = keccak256("TORO Seafood Factory");
        values[1] = keccak256("HACCP-2026-001");

        return _encodeTrace(codes, values);
    }

    function _dummyFinalData() internal pure returns (bytes memory) {
        uint256[] memory codes = new uint256[](1);
        codes[0] = 0x501; // final product label

        bytes32[] memory values = new bytes32[](1);
        values[0] = keccak256("TORO Premium Tuna");

        return _encodeTrace(codes, values);
    }

    // ───────── Access Control ─────────

    function test_StrangerCannotMint() public {
        vm.prank(stranger);
        vm.expectRevert(ToroSBT.Unauthorized.selector);
        sbt.mint(address(stationA), BATCH_1);
    }

    function test_StrangerCannotEvolve() public {
        vm.prank(stranger);
        vm.expectRevert(ToroStation.Unauthorized.selector);
        stationA.evolve(1, 1, _dummyManufData(), address(stationB));
    }

    function test_StrangerCannotFinalize() public {
        vm.prank(stranger);
        vm.expectRevert(ToroRecordMinter.Unauthorized.selector);
        uint256[] memory ids = new uint256[](1);
        recordMinter.finalize(ids, 1000, LOT_CODE, block.timestamp, _dummyFinalData());
    }

    // ───────── Full Single Chain Flow ─────────

    function test_FullSingleChain() public {
        // 1. Factory mints batch with source data → sends to Station A
        vm.prank(factorySigner);
        (uint256 tokenId, bytes32 sourceHash) = factory.mintBatch(BATCH_1, address(stationA), _dummySourceData());

        assertEq(tokenId, 1);
        assertEq(sbt.ownerOf(tokenId), address(stationA));
        assertEq(sbt.batchIdOf(tokenId), BATCH_1);
        assertFalse(sbt.frozen(tokenId));

        // Verify source trace
        assertEq(registry.tokenTraceCount(tokenId), 1);

        // 2. Station A evolves (Manufacturing) → passes to Station B
        vm.prank(stationSignerA);
        stationA.evolve(tokenId, 1, _dummyManufData(), address(stationB));

        assertEq(sbt.ownerOf(tokenId), address(stationB));
        assertEq(registry.tokenTraceCount(tokenId), 2);

        // 3. Station B evolves (Warehouse) → passes to Station C
        vm.prank(stationSignerB);
        stationB.evolve(tokenId, 2, _dummyManufData(), address(stationC));

        assertEq(sbt.ownerOf(tokenId), address(stationC));
        assertEq(registry.tokenTraceCount(tokenId), 3);

        // 4. Station C evolves (Distribution) → passes to Record Minter
        vm.prank(stationSignerC);
        stationC.evolve(tokenId, 3, _dummyManufData(), address(recordMinter));

        assertEq(sbt.ownerOf(tokenId), address(recordMinter));
        assertEq(registry.tokenTraceCount(tokenId), 4);

        // 5. Record Minter finalizes
        uint256[] memory ids = new uint256[](1);
        ids[0] = tokenId;

        vm.prank(recordSigner);
        bytes32 finalHash = recordMinter.finalize(ids, 3900, LOT_CODE, block.timestamp, _dummyFinalData());

        // Verify frozen
        assertTrue(sbt.frozen(tokenId));
        assertEq(recordMinter.tokenLotCode(tokenId), LOT_CODE);

        // Verify final record
        ToroRecordMinter.FinalRecord memory rec = recordMinter.getFinalRecord(LOT_CODE);
        assertTrue(rec.exists);
        assertEq(rec.totalCans, 3900);
        assertEq(rec.tokenIds.length, 1);
        assertEq(rec.tokenIds[0], tokenId);

        // Verify total traces = 5 (Source + Manuf + Warehouse + Dist + Final)
        assertEq(registry.tokenTraceCount(tokenId), 5);

        // Verify history
        bytes32[] memory history = registry.getTokenHistory(tokenId);
        assertEq(history.length, 5);
        assertEq(history[0], sourceHash);
        assertEq(history[4], finalHash);
    }

    // ───────── Merge Flow (Multiple Batches → One Final) ─────────

    function test_MergeTwoBatches() public {
        // Mint batch 1 → Station A
        vm.prank(factorySigner);
        (uint256 tokenId1,) = factory.mintBatch(BATCH_1, address(stationA), _dummySourceData());

        // Mint batch 2 → Station A
        vm.prank(factorySigner);
        (uint256 tokenId2,) = factory.mintBatch(BATCH_2, address(stationA), _dummySourceData());

        // Both go through A → B → C → Record Minter
        vm.prank(stationSignerA);
        stationA.evolve(tokenId1, 1, _dummyManufData(), address(stationB));
        vm.prank(stationSignerA);
        stationA.evolve(tokenId2, 1, _dummyManufData(), address(stationB));

        vm.prank(stationSignerB);
        stationB.evolve(tokenId1, 2, _dummyManufData(), address(stationC));
        vm.prank(stationSignerB);
        stationB.evolve(tokenId2, 2, _dummyManufData(), address(stationC));

        vm.prank(stationSignerC);
        stationC.evolve(tokenId1, 3, _dummyManufData(), address(recordMinter));
        vm.prank(stationSignerC);
        stationC.evolve(tokenId2, 3, _dummyManufData(), address(recordMinter));

        assertEq(sbt.ownerOf(tokenId1), address(recordMinter));
        assertEq(sbt.ownerOf(tokenId2), address(recordMinter));

        // Finalize merge
        uint256[] memory ids = new uint256[](2);
        ids[0] = tokenId1;
        ids[1] = tokenId2;

        vm.prank(recordSigner);
        recordMinter.finalize(ids, 5440, LOT_CODE, block.timestamp, _dummyFinalData());

        // Both frozen
        assertTrue(sbt.frozen(tokenId1));
        assertTrue(sbt.frozen(tokenId2));

        // Final record has both
        ToroRecordMinter.FinalRecord memory rec = recordMinter.getFinalRecord(LOT_CODE);
        assertEq(rec.tokenIds.length, 2);
        assertEq(rec.totalCans, 5440);
    }

    // ───────── Soulbound Restrictions ─────────

    function test_CannotTransferToUnauthorized() public {
        vm.prank(factorySigner);
        (uint256 tokenId,) = factory.mintBatch(BATCH_1, address(stationA), _dummySourceData());

        vm.prank(stationSignerA);
        vm.expectRevert(ToroSBT.InvalidTransfer.selector);
        stationA.pass(tokenId, stranger);
    }

    function test_CannotTransferFrozenToken() public {
        vm.prank(factorySigner);
        (uint256 tokenId,) = factory.mintBatch(BATCH_1, address(stationA), _dummySourceData());

        vm.prank(stationSignerA);
        stationA.evolve(tokenId, 1, _dummyManufData(), address(recordMinter));

        vm.prank(recordSigner);
        uint256[] memory ids = new uint256[](1);
        ids[0] = tokenId;
        recordMinter.finalize(ids, 100, LOT_CODE, block.timestamp, _dummyFinalData());

        // Try to transfer frozen token
        vm.prank(address(recordMinter));
        vm.expectRevert(ToroSBT.TokenFrozen.selector);
        sbt.transferFrom(address(recordMinter), address(stationA), tokenId);
    }

    // ───────── Station Cannot Evolve Token It Does Not Hold ─────────

    function test_StationCannotEvolveForeignToken() public {
        vm.prank(factorySigner);
        (uint256 tokenId,) = factory.mintBatch(BATCH_1, address(stationA), _dummySourceData());

        vm.prank(stationSignerB);
        vm.expectRevert(ToroStation.NotTokenOwner.selector);
        stationB.evolve(tokenId, 1, _dummyManufData(), address(stationC));
    }

    // ───────── Registry Code Labels ─────────

    function test_CodeLabels() public {
        vm.prank(owner);
        registry.setCodeLabel(0x725, "Fishing Method: Net Catch");

        assertEq(registry.codeLabels(0x725), "Fishing Method: Net Catch");
    }
}
