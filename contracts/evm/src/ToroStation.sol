// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import {ToroSBT} from "./ToroSBT.sol";
import {ToroRegistry} from "./ToroRegistry.sol";

/// @title ToroStation
/// @notice A supply chain station that holds SBTs, records traces, and passes tokens forward.
/// @dev Deploy one instance per station. Signers execute evolve() and pass().
contract ToroStation is IERC721Receiver {

    // ───────── Errors ─────────
    error Unauthorized();
    error NotTokenOwner();
    error ZeroAddress();

    // ───────── Events ─────────
    event Evolved(uint256 indexed tokenId, uint8 stage, bytes32 traceHash);
    event Passed(uint256 indexed tokenId, address indexed from, address indexed to);

    // ───────── Roles ─────────
    address public owner;
    mapping(address => bool) public stationSigners;

    // ───────── Contracts ─────────
    ToroSBT public immutable sbt;
    ToroRegistry public immutable registry;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyStationSigner() {
        if (msg.sender != owner && !stationSigners[msg.sender]) revert Unauthorized();
        _;
    }

    constructor(address _sbt, address _registry) {
        owner = msg.sender;
        sbt = ToroSBT(_sbt);
        registry = ToroRegistry(_registry);
    }

    // ───────── Signer Management ─────────

    function addSigner(address _signer) external onlyOwner {
        stationSigners[_signer] = true;
    }

    function removeSigner(address _signer) external onlyOwner {
        stationSigners[_signer] = false;
    }

    // ───────── Core Operations ─────────

    /// @notice Record trace data for a token this station holds.
    /// @param _tokenId The SBT token ID.
    /// @param _stage Stage enum value.
    /// @param _data ABI-encoded trace data.
    /// @param _nextStation If non-zero, transfer the token after recording.
    function evolve(uint256 _tokenId, uint8 _stage, bytes calldata _data, address _nextStation) external onlyStationSigner returns (bytes32 traceHash) {
        if (sbt.ownerOf(_tokenId) != address(this)) revert NotTokenOwner();

        traceHash = registry.record(_tokenId, _stage, _data);
        emit Evolved(_tokenId, _stage, traceHash);

        if (_nextStation != address(0)) {
            sbt.transferFrom(address(this), _nextStation, _tokenId);
            emit Passed(_tokenId, address(this), _nextStation);
        }
    }

    /// @notice Transfer a held token to another station without recording new data.
    function pass(uint256 _tokenId, address _nextStation) external onlyStationSigner {
        if (_nextStation == address(0)) revert ZeroAddress();
        if (sbt.ownerOf(_tokenId) != address(this)) revert NotTokenOwner();

        sbt.transferFrom(address(this), _nextStation, _tokenId);
        emit Passed(_tokenId, address(this), _nextStation);
    }

    // ───────── IERC721Receiver ─────────

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
