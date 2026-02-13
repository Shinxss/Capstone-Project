// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LifelineTaskLedger
/// @notice Minimal on-chain audit trail for VERIFIED tasks.
///         Stores only hashes (no PII). Emits an event for easy indexing.
contract LifelineTaskLedger {
    address public owner;

    /// @dev Prevent duplicate recording of the same hash.
    mapping(bytes32 => bool) public recorded;

    /// @notice Emitted when an LGU verifies completion of a volunteer task.
    event TaskVerified(
        bytes32 indexed recordHash,
        bytes32 indexed dispatchIdHash,
        bytes32 indexed emergencyIdHash,
        bytes32 volunteerIdHash,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        owner = newOwner;
    }

    /// @notice Record a verified task (hash-only).
    /// @dev Prevents duplicates by recordHash.
    function recordTask(
        bytes32 recordHash,
        bytes32 dispatchIdHash,
        bytes32 emergencyIdHash,
        bytes32 volunteerIdHash
    ) external onlyOwner {
        require(recordHash != bytes32(0), "bad hash");
        require(!recorded[recordHash], "already recorded");
        recorded[recordHash] = true;

        emit TaskVerified(recordHash, dispatchIdHash, emergencyIdHash, volunteerIdHash, block.timestamp);
    }
}
