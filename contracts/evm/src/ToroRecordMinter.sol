// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {ToroSBT} from "./ToroSBT.sol";
import {ToroRegistry} from "./ToroRegistry.sol";

/// @title ToroRecordMinter
/// @notice Final merge checkpoint. Receives SBTs, freezes them, and logs the final product record.
/// @dev Holds frozen NFTs forever. Acts as their permanent owner (graveyard).
contract ToroRecordMinter is IERC721Receiver {

    // ───────── Errors ─────────
    error Unauthorized();
    error NotHoldingToken();
    error AlreadyFinalized();

    // ───────── Events ─────────
    event Finalized(
        bytes32 indexed lotCode,
        uint256[] tokenIds,
        uint256 totalCans,
        bytes32 finalTraceHash
    );
    event RecordSignerAdded(address indexed signer);
    event RecordSignerRemoved(address indexed signer);

    // ───────── Roles ─────────
    address public owner;
    mapping(address => bool) public recordSigners;

    // ───────── Contracts ─────────
    ToroSBT public immutable sbt;
    ToroRegistry public immutable registry;

    // ───────── Final Records ─────────
    struct FinalRecord {
        uint256[] tokenIds;
        uint256 totalCans;
        uint256 packagingDate;
        bytes32 finalTraceHash;
        bool exists;
    }

    mapping(bytes32 => FinalRecord) public finalRecords; // lotCode => record
    mapping(uint256 => bytes32) public tokenLotCode;     // tokenId => lotCode

    uint8 public constant STAGE_FINAL = 4;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyRecordSigner() {
        if (msg.sender != owner && !recordSigners[msg.sender]) revert Unauthorized();
        _;
    }

    constructor(address _sbt, address _registry) {
        owner = msg.sender;
        sbt = ToroSBT(_sbt);
        registry = ToroRegistry(_registry);
    }

    // ───────── Signer Management ─────────

    function addRecordSigner(address _signer) external onlyOwner {
        recordSigners[_signer] = true;
        emit RecordSignerAdded(_signer);
    }

    function removeRecordSigner(address _signer) external onlyOwner {
        recordSigners[_signer] = false;
        emit RecordSignerRemoved(_signer);
    }

    // ───────── Finalize ─────────

    /// @notice Finalize one or more tokens into a merged product record.
    /// @param _tokenIds Array of token IDs this contract must already hold.
    /// @param _totalCans Total output cans.
    /// @param _lotCode Final product lot code.
    /// @param _packagingDate Packaging timestamp.
    /// @param _finalData ABI-encoded final trace data.
    function finalize(
        uint256[] calldata _tokenIds,
        uint256 _totalCans,
        bytes32 _lotCode,
        uint256 _packagingDate,
        bytes calldata _finalData
    ) external onlyRecordSigner returns (bytes32 finalTraceHash) {
        if (finalRecords[_lotCode].exists) revert AlreadyFinalized();

        // Verify we hold every token
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            if (sbt.ownerOf(_tokenIds[i]) != address(this)) revert NotHoldingToken();
        }

        // Record final trace
        // For merges, we attach the lotCode to the first token's record;
        // the rest get linked via the FinalRecord struct.
        finalTraceHash = registry.record(_tokenIds[0], STAGE_FINAL, _finalData);

        // Freeze all input tokens
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            sbt.freeze(_tokenIds[i], finalTraceHash);
            tokenLotCode[_tokenIds[i]] = _lotCode;
        }

        // Store final record
        finalRecords[_lotCode] = FinalRecord({
            tokenIds: _tokenIds,
            totalCans: _totalCans,
            packagingDate: _packagingDate,
            finalTraceHash: finalTraceHash,
            exists: true
        });

        emit Finalized(_lotCode, _tokenIds, _totalCans, finalTraceHash);
    }

    // ───────── Views ─────────

    function getFinalRecord(bytes32 _lotCode) external view returns (FinalRecord memory) {
        return finalRecords[_lotCode];
    }

    // ───────── IERC721Receiver ─────────

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
