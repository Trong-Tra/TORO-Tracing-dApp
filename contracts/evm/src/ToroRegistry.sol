// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ToroRegistry
/// @notice On-chain registry for all TORO trace points.
/// @dev Every evolve() call produces a unique record keyed by a derived hash.
///      The actual blockchain tx hash verifies the record externally.
contract ToroRegistry {

    // ───────── Errors ─────────
    error Unauthorized();

    // ───────── Events ─────────
    event TraceRecorded(
        bytes32 indexed txHash,
        uint256 indexed tokenId,
        uint8 indexed stage,
        address recorder,
        uint256 timestamp
    );

    // ───────── Roles ─────────
    address public owner;
    mapping(address => bool) public authorizedRecorders;

    // ───────── Data ─────────
    struct TracePoint {
        uint256 tokenId;
        uint8 stage;
        bytes data; // abi-encoded(uint256[] codes, bytes32[] values)
        uint256 timestamp;
        address recorder;
    }

    // derived record hash => TracePoint
    mapping(bytes32 => TracePoint) public traces;

    // tokenId => list of record hashes (chronological)
    mapping(uint256 => bytes32[]) public tokenHistory;

    // optional human-readable labels for compact codes
    mapping(uint256 => string) public codeLabels;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedRecorders[msg.sender]) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ───────── Admin ─────────

    function authorizeRecorder(address _recorder) external onlyAuthorized {
        authorizedRecorders[_recorder] = true;
    }

    function revokeRecorder(address _recorder) external onlyAuthorized {
        authorizedRecorders[_recorder] = false;
    }

    function setCodeLabel(uint256 _code, string calldata _label) external onlyOwner {
        codeLabels[_code] = _label;
    }

    // ───────── Record ─────────

    /// @notice Write a trace point for a token.
    /// @return txHash A derived unique hash for this record.
    function record(uint256 _tokenId, uint8 _stage, bytes calldata _data) external onlyAuthorized returns (bytes32 txHash) {
        txHash = keccak256(
            abi.encodePacked(
                block.chainid,
                block.number,
                block.timestamp,
                msg.sender,
                _tokenId,
                _stage,
                _data
            )
        );

        traces[txHash] = TracePoint({
            tokenId: _tokenId,
            stage: _stage,
            data: _data,
            timestamp: block.timestamp,
            recorder: msg.sender
        });

        tokenHistory[_tokenId].push(txHash);

        emit TraceRecorded(txHash, _tokenId, _stage, msg.sender, block.timestamp);
    }

    // ───────── Views ─────────

    function tokenTraceCount(uint256 _tokenId) external view returns (uint256) {
        return tokenHistory[_tokenId].length;
    }

    function getTokenHistory(uint256 _tokenId) external view returns (bytes32[] memory) {
        return tokenHistory[_tokenId];
    }

    function getTrace(bytes32 _txHash) external view returns (TracePoint memory) {
        return traces[_txHash];
    }
}
