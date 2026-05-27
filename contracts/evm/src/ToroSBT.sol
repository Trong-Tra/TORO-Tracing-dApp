// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

/// @title ToroSBT
/// @notice Soulbound batch token for TORO supply chain tracing.
/// @dev Transferable only between authorized stations and the record minter.
///      Once frozen, a token can never move or evolve again.
contract ToroSBT is ERC721 {

    // ───────── Errors ─────────
    error Unauthorized();
    error InvalidTransfer();
    error TokenFrozen();
    error AlreadyMinted();

    // ───────── Events ─────────
    event Minted(uint256 indexed tokenId, bytes32 indexed batchId, address indexed to);
    event Frozen(uint256 indexed tokenId, bytes32 indexed finalTxHash);

    // ───────── Roles ─────────
    address public factory;
    address public recordMinter;
    mapping(address => bool) public authorizedStations;

    // ───────── Token State ─────────
    uint256 public totalMinted;
    mapping(uint256 => bytes32) public batchIdOf;
    mapping(uint256 => bool) public frozen;
    mapping(bytes32 => uint256) public tokenIdOfBatch;

    modifier onlyFactory() {
        if (msg.sender != factory) revert Unauthorized();
        _;
    }

    modifier onlyRecordMinter() {
        if (msg.sender != recordMinter) revert Unauthorized();
        _;
    }

    constructor() ERC721("TORO Batch SBT", "TORO") {
        factory = msg.sender; // temporary, transferred after Factory is deployed
    }

    function transferFactoryOwnership(address _newFactory) external onlyFactory {
        factory = _newFactory;
    }

    // ───────── Admin ─────────

    function setRecordMinter(address _recordMinter) external onlyFactory {
        recordMinter = _recordMinter;
    }

    function authorizeStation(address _station) external onlyFactory {
        authorizedStations[_station] = true;
    }

    function revokeStation(address _station) external onlyFactory {
        authorizedStations[_station] = false;
    }

    // ───────── Mint ─────────

    /// @notice Factory mints a new batch SBT and transfers to the first station.
    function mint(address _to, bytes32 _batchId) external onlyFactory returns (uint256 tokenId) {
        if (tokenIdOfBatch[_batchId] != 0) revert AlreadyMinted();

        totalMinted++;
        tokenId = totalMinted;
        batchIdOf[tokenId] = _batchId;
        tokenIdOfBatch[_batchId] = tokenId;

        _safeMint(_to, tokenId);
        emit Minted(tokenId, _batchId, _to);
    }

    // ───────── Freeze ─────────

    /// @notice Record minter freezes a token permanently (terminal state).
    function freeze(uint256 _tokenId, bytes32 _finalTxHash) external onlyRecordMinter {
        frozen[_tokenId] = true;
        emit Frozen(_tokenId, _finalTxHash);
    }

    // ───────── Transfer Overrides (Soulbound Logic) ─────────

    function _update(address _to, uint256 _tokenId, address _auth) internal override returns (address) {
        address from = super._update(_to, _tokenId, _auth);

        // Mint is always allowed (from == address(0))
        if (from == address(0)) return from;

        // Burn is not implemented, but would be allowed
        if (_to == address(0)) return from;

        // Frozen tokens cannot move
        if (frozen[_tokenId]) revert TokenFrozen();

        // Only authorized stations or record minter can receive
        if (!authorizedStations[_to] && _to != recordMinter) revert InvalidTransfer();

        // Only authorized stations or record minter can send
        if (!authorizedStations[from] && from != recordMinter) revert InvalidTransfer();

        return from;
    }

    // ───────── Views ─────────

    function exists(uint256 _tokenId) external view returns (bool) {
        return _ownerOf(_tokenId) != address(0);
    }
}
