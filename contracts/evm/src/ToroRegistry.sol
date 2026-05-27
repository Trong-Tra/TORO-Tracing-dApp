// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ToroRegistry
/// @notice Single-contract trace registry for TORO seafood traceability./// @dev Stores minimal state for validation; full trace data lives in events.
contract ToroRegistry {
    // ───────── Errors ─────────
    error Unauthorized();
    error BatchExists();
    error InvalidStage();
    error LotExists();
    error BatchNotAtManufacturing();

    // ───────── Events ─────────
    event BatchMinted(
        bytes32 indexed batchId,
        bytes data,
        uint256 timestamp,
        address indexed recorder
    );

    event TraceRecorded(
        bytes32 indexed id,
        uint8 indexed stage,
        bytes data,
        uint256 timestamp,
        address indexed recorder
    );

    event LotCreated(
        bytes32 indexed lotCode,
        bytes32[] inputBatchIds,
        uint256 totalCans,
        bytes data,
        uint256 timestamp,
        address indexed recorder
    );

    // ───────── Roles ─────────
    address public owner;
    mapping(address => bool) public factorySigners;
    mapping(address => bool) public authorizedStations;

    // ───────── State ─────────
    // batch stage: 0=none, 1=source, 2=inventory, 3=manufacturing
    mapping(bytes32 => uint8) public batchStage;
    // lot stage: 0=none, 3=manufacturing, 4=warehouse, 5=distribution
    mapping(bytes32 => uint8) public lotStage;
    // lot => input batch IDs
    mapping(bytes32 => bytes32[]) public lotInputBatches;

    // ───────── Modifiers ─────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyFactorySigner() {
        if (!factorySigners[msg.sender] && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyStation() {
        if (!authorizedStations[msg.sender] && msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ───────── Admin ─────────
    function addFactorySigner(address signer) external onlyOwner {
        factorySigners[signer] = true;
    }

    function removeFactorySigner(address signer) external onlyOwner {
        factorySigners[signer] = false;
    }

    function authorizeStation(address station) external onlyOwner {
        authorizedStations[station] = true;
    }

    function revokeStation(address station) external onlyOwner {
        authorizedStations[station] = false;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ───────── Batch Lifecycle ─────────

    function mintBatch(bytes32 batchId, bytes calldata data) external onlyFactorySigner {
        if (batchStage[batchId] != 0) revert BatchExists();
        batchStage[batchId] = 1;
        emit BatchMinted(batchId, data, block.timestamp, msg.sender);
        emit TraceRecorded(batchId, 1, data, block.timestamp, msg.sender);
    }

    function recordInventory(bytes32 batchId, bytes calldata data) external onlyStation {
        if (batchStage[batchId] != 1) revert InvalidStage();
        batchStage[batchId] = 2;
        emit TraceRecorded(batchId, 2, data, block.timestamp, msg.sender);
    }

    function recordManufacturing(bytes32 batchId, bytes calldata data) external onlyStation {
        if (batchStage[batchId] != 2) revert InvalidStage();
        batchStage[batchId] = 3;
        emit TraceRecorded(batchId, 3, data, block.timestamp, msg.sender);
    }

    // ───────── Lot Creation (Merge Point) ─────────

    function createProductLot(
        bytes32 lotCode,
        bytes32[] calldata batchIds,
        uint256 totalCans,
        bytes calldata data
    ) external onlyFactorySigner {
        if (lotStage[lotCode] != 0) revert LotExists();
        for (uint256 i = 0; i < batchIds.length; i++) {
            if (batchStage[batchIds[i]] != 3) revert BatchNotAtManufacturing();
        }
        lotStage[lotCode] = 3;
        lotInputBatches[lotCode] = batchIds;
        emit LotCreated(lotCode, batchIds, totalCans, data, block.timestamp, msg.sender);
        emit TraceRecorded(lotCode, 3, data, block.timestamp, msg.sender);
    }

    // ───────── Lot Lifecycle ─────────

    function recordWarehouse(bytes32 lotCode, bytes calldata data) external onlyStation {
        if (lotStage[lotCode] != 3) revert InvalidStage();
        lotStage[lotCode] = 4;
        emit TraceRecorded(lotCode, 4, data, block.timestamp, msg.sender);
    }

    function recordDistribution(bytes32 lotCode, bytes calldata data) external onlyStation {
        if (lotStage[lotCode] != 4) revert InvalidStage();
        lotStage[lotCode] = 5;
        emit TraceRecorded(lotCode, 5, data, block.timestamp, msg.sender);
    }

    // ───────── Views ─────────

    function getLotInputBatches(bytes32 lotCode) external view returns (bytes32[] memory) {
        return lotInputBatches[lotCode];
    }
}
