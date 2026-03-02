// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TaskLedger is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    mapping(bytes32 => bytes32) public verifiedPayloadByTask;
    mapping(bytes32 => bool) public revokedTask;

    event TaskVerified(
        bytes32 indexed taskIdHash,
        bytes32 indexed payloadHash,
        address indexed verifier,
        uint256 timestamp
    );

    event TaskVerificationRevoked(
        bytes32 indexed taskIdHash,
        bytes32 indexed reasonHash,
        address indexed admin,
        uint256 timestamp
    );

    event TaskReverified(
        bytes32 indexed taskIdHash,
        bytes32 indexed oldPayloadHash,
        bytes32 indexed newPayloadHash,
        address admin,
        uint256 timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function grantVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, verifier);
    }

    function verifyTask(bytes32 taskIdHash, bytes32 payloadHash)
        public
        onlyRole(VERIFIER_ROLE)
    {
        require(
            verifiedPayloadByTask[taskIdHash] == bytes32(0),
            "ALREADY_VERIFIED"
        );
        verifiedPayloadByTask[taskIdHash] = payloadHash;
        // Keep default false state; no explicit write needed on first verification.
        emit TaskVerified(taskIdHash, payloadHash, msg.sender, block.timestamp);
    }

    // Backward-compatible alias for older clients.
    function recordVerification(bytes32 taskIdHash, bytes32 payloadHash) external {
        verifyTask(taskIdHash, payloadHash);
    }

    function revokeTaskVerification(bytes32 taskIdHash, bytes32 reasonHash)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(
            verifiedPayloadByTask[taskIdHash] != bytes32(0),
            "NOT_VERIFIED"
        );
        revokedTask[taskIdHash] = true;
        emit TaskVerificationRevoked(
            taskIdHash,
            reasonHash,
            msg.sender,
            block.timestamp
        );
    }

    function reverifyTask(bytes32 taskIdHash, bytes32 newPayloadHash)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(
            verifiedPayloadByTask[taskIdHash] != bytes32(0),
            "NOT_VERIFIED"
        );
        bytes32 oldPayloadHash = verifiedPayloadByTask[taskIdHash];
        verifiedPayloadByTask[taskIdHash] = newPayloadHash;
        revokedTask[taskIdHash] = false;
        emit TaskReverified(
            taskIdHash,
            oldPayloadHash,
            newPayloadHash,
            msg.sender,
            block.timestamp
        );
    }
}
