// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ToroSBT} from "./ToroSBT.sol";
import {ToroRegistry} from "./ToroRegistry.sol";

/// @title ToroFactory
/// @notice Mints new batch SBTs and manages the station network.
/// @dev Factory signers can mint. Factory owner manages stations and signers.
contract ToroFactory {

    // ───────── Errors ─────────
    error Unauthorized();
    error InvalidStation();

    // ───────── Events ─────────
    event BatchMinted(
        uint256 indexed tokenId,
        bytes32 indexed batchId,
        address indexed firstStation,
        bytes32 traceHash
    );
    event StationAuthorized(address indexed station);
    event StationRevoked(address indexed station);
    event FactorySignerAdded(address indexed signer);
    event FactorySignerRemoved(address indexed signer);

    // ───────── Roles ─────────
    address public owner;
    mapping(address => bool) public factorySigners;
    mapping(address => bool) public authorizedStations;

    // ───────── Contracts ─────────
    ToroSBT public immutable sbt;
    ToroRegistry public immutable registry;

    // ───────── Constants ─────────
    uint8 public constant STAGE_SOURCE = 0;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyFactorySigner() {
        if (msg.sender != owner && !factorySigners[msg.sender]) revert Unauthorized();
        _;
    }

    constructor(address _sbt, address _registry) {
        owner = msg.sender;
        sbt = ToroSBT(_sbt);
        registry = ToroRegistry(_registry);
    }

    // ───────── Signer Management ─────────

    function addFactorySigner(address _signer) external onlyOwner {
        factorySigners[_signer] = true;
        emit FactorySignerAdded(_signer);
    }

    function removeFactorySigner(address _signer) external onlyOwner {
        factorySigners[_signer] = false;
        emit FactorySignerRemoved(_signer);
    }

    // ───────── Station Management ─────────

    function authorizeStation(address _station) external onlyOwner {
        authorizedStations[_station] = true;
        sbt.authorizeStation(_station);
        registry.authorizeRecorder(_station);
        emit StationAuthorized(_station);
    }

    function revokeStation(address _station) external onlyOwner {
        authorizedStations[_station] = false;
        sbt.revokeStation(_station);
        registry.revokeRecorder(_station);
        emit StationRevoked(_station);
    }

    // ───────── Batch Minting ─────────

    /// @notice Mint a new batch SBT with initial source data.
    /// @param _batchId Unique batch identifier.
    /// @param _firstStation Address of the first authorized station.
    /// @param _data ABI-encoded trace data (codes + values).
    function mintBatch(bytes32 _batchId, address _firstStation, bytes calldata _data) external onlyFactorySigner returns (uint256 tokenId, bytes32 traceHash) {
        if (!authorizedStations[_firstStation]) revert InvalidStation();

        tokenId = sbt.mint(_firstStation, _batchId);
        traceHash = registry.record(tokenId, STAGE_SOURCE, _data);

        emit BatchMinted(tokenId, _batchId, _firstStation, traceHash);
    }

    // ───────── Views ─────────

    function isAuthorizedStation(address _station) external view returns (bool) {
        return authorizedStations[_station];
    }
}
