// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ToroTypes} from "./ToroTypes.sol";

/// @title ToroRegistry
/// @notice On-chain registry for tracing tuna from catch to can.
/// @dev Two supply chains (Farm A and Catch B) converge at FinalProduct.
contract ToroRegistry {

    // ───────── Errors ─────────
    error Unauthorized();
    error InvalidStageSequence();
    error BatchAlreadyExists();
    error BatchNotFound();
    error ChainNotReady();

    // ───────── Events ─────────
    event StageRecorded(
        bytes32 indexed batchId,
        ToroTypes.Stage indexed stage,
        bytes32 txHash,
        uint256 timestamp
    );

    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);

    // ───────── State ─────────
    address public owner;
    mapping(address => bool) public operators;

    // batchId => list of stage hashes (chronological)
    mapping(bytes32 => bytes32[]) public batchHistory;

    // keccak256(batchId + stageIndex + encodedData) => true
    mapping(bytes32 => bool) public knownRecords;

    // Per-stage detail storage ( keyed by txHash )
    mapping(bytes32 => ToroTypes.Hatchery) public hatcheries;
    mapping(bytes32 => ToroTypes.Nursery) public nurseries;
    mapping(bytes32 => ToroTypes.Growout) public growouts;
    mapping(bytes32 => ToroTypes.HarvestTransport) public harvestTransports;
    mapping(bytes32 => ToroTypes.FarmProcessing) public farmProcessings;
    mapping(bytes32 => ToroTypes.CatchIce) public catchIces;
    mapping(bytes32 => ToroTypes.PortLanding) public portLandings;
    mapping(bytes32 => ToroTypes.TransportPlant) public transportPlants;
    mapping(bytes32 => ToroTypes.CatchProcessing) public catchProcessings;
    mapping(bytes32 => ToroTypes.FinalProduct) public finalProducts;

    // txHash => stage enum (for lookups)
    mapping(bytes32 => ToroTypes.Stage) public recordStage;

    // batchId => stage => txHash (latest for that stage)
    mapping(bytes32 => mapping(ToroTypes.Stage => bytes32)) public latestStageHash;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != owner && !operators[msg.sender]) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ───────── Admin ─────────
    function addOperator(address _operator) external onlyOwner {
        operators[_operator] = true;
        emit OperatorAdded(_operator);
    }

    function removeOperator(address _operator) external onlyOwner {
        operators[_operator] = false;
        emit OperatorRemoved(_operator);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    // ───────── Helpers ─────────
    function _stageIndex(ToroTypes.Stage _stage) internal pure returns (uint256) {
        return uint256(_stage);
    }

    function _recordHash(bytes32 _batchId, uint256 _stageIdx, bytes memory _encoded) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_batchId, _stageIdx, _encoded));
    }

    function _storeRecord(bytes32 _batchId, ToroTypes.Stage _stage, bytes32 _txHash, bytes memory _encoded) internal {
        bytes32 hash = _recordHash(_batchId, _stageIndex(_stage), _encoded);
        if (knownRecords[hash]) revert BatchAlreadyExists();
        knownRecords[hash] = true;

        batchHistory[_batchId].push(_txHash);
        recordStage[_txHash] = _stage;
        latestStageHash[_batchId][_stage] = _txHash;

        emit StageRecorded(_batchId, _stage, _txHash, block.timestamp);
    }

    // ───────── Farm Chain (A) ─────────

    function recordHatchery(ToroTypes.Hatchery calldata _data) external onlyOperator returns (bytes32 txHash) {
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        hatcheries[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.Hatchery, txHash, abi.encode(_data));
    }

    function recordNursery(ToroTypes.Nursery calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.Hatchery] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        nurseries[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.Nursery, txHash, abi.encode(_data));
    }

    function recordGrowout(ToroTypes.Growout calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.Nursery] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        growouts[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.Growout, txHash, abi.encode(_data));
    }

    function recordHarvestTransport(ToroTypes.HarvestTransport calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.Growout] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        harvestTransports[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.HarvestTransport, txHash, abi.encode(_data));
    }

    function recordFarmProcessing(ToroTypes.FarmProcessing calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.HarvestTransport] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        farmProcessings[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.FarmProcessing, txHash, abi.encode(_data));
    }

    // ───────── Catch Chain (B) ─────────

    function recordCatchIce(ToroTypes.CatchIce calldata _data) external onlyOperator returns (bytes32 txHash) {
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        catchIces[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.CatchIce, txHash, abi.encode(_data));
    }

    function recordPortLanding(ToroTypes.PortLanding calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.CatchIce] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        portLandings[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.PortLanding, txHash, abi.encode(_data));
    }

    function recordTransportPlant(ToroTypes.TransportPlant calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.PortLanding] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        transportPlants[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.TransportPlant, txHash, abi.encode(_data));
    }

    function recordCatchProcessing(ToroTypes.CatchProcessing calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.TransportPlant] == bytes32(0)) revert InvalidStageSequence();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        catchProcessings[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.CatchProcessing, txHash, abi.encode(_data));
    }

    // ───────── Final Product ─────────

    function recordFinalProduct(ToroTypes.FinalProduct calldata _data) external onlyOperator returns (bytes32 txHash) {
        if (latestStageHash[_data.batchId][ToroTypes.Stage.FarmProcessing] == bytes32(0)) revert ChainNotReady();
        if (latestStageHash[_data.batchId][ToroTypes.Stage.CatchProcessing] == bytes32(0)) revert ChainNotReady();
        txHash = keccak256(abi.encode(_data, block.timestamp, block.number));
        finalProducts[txHash] = _data;
        _storeRecord(_data.batchId, ToroTypes.Stage.FinalProduct, txHash, abi.encode(_data));
    }

    // ───────── Views ─────────

    function batchStageCount(bytes32 _batchId) external view returns (uint256) {
        return batchHistory[_batchId].length;
    }

    function getBatchHistory(bytes32 _batchId) external view returns (bytes32[] memory) {
        return batchHistory[_batchId];
    }

    function getLatestStageHash(bytes32 _batchId, ToroTypes.Stage _stage) external view returns (bytes32) {
        return latestStageHash[_batchId][_stage];
    }
}
