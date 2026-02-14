// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TaskLedger is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    event TaskVerified(
        bytes32 indexed taskIdHash,
        bytes32 indexed payloadHash,
        address indexed verifier,
        uint256 timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function grantVerifier(address verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, verifier);
    }

    function recordVerification(bytes32 taskIdHash, bytes32 payloadHash)
        external
        onlyRole(VERIFIER_ROLE)
    {
        emit TaskVerified(taskIdHash, payloadHash, msg.sender, block.timestamp);
    }
}