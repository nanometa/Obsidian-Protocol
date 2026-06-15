// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ObsidianVault
/// @notice Immutable registry for encrypted dead man's switch vaults.
contract ObsidianVault {
    uint256 public constant TIMER_7_DAYS = 7 days;
    uint256 public constant TIMER_14_DAYS = 14 days;
    uint256 public constant TIMER_30_DAYS = 30 days;

    enum Status {
        None,
        Active,
        Expired,
        Triggered
    }

    struct Vault {
        bool exists;
        address owner;
        string ipfsHash;
        /// @dev Age-encrypted XOR share A of the AES key.
        string encryptedKeyPartA;
        /// @dev Age-encrypted XOR share B of the AES key. Returned by getVault only after trigger.
        string encryptedKeyPartB;
        uint256 timerDuration;
        uint256 createdAt;
        uint256 lastHeartbeat;
        uint256 triggeredAt;
        bool triggered;
        address[] beneficiaries;
    }

    mapping(address => Vault) private vaults;

    event VaultCreated(address indexed user, string ipfsHash, uint256 timer);
    event HeartbeatSent(address indexed user, uint256 nextDeadline);
    event TriggerActivated(
        address indexed user,
        string ipfsHash,
        string encryptedKeyPartA,
        string encryptedKeyPartB
    );

    error VaultAlreadyExists();
    error VaultNotFound();
    error InvalidTimer();
    error InvalidIpfsHash();
    error InvalidDecryptionKey();
    error EmptyBeneficiaries();
    error InvalidBeneficiary();
    error DuplicateBeneficiary();
    error NotVaultOwner();
    error VaultExpired();
    error VaultAlreadyTriggered();
    error VaultStillActive();

    function createVault(
        string calldata ipfsHash,
        string calldata encryptedKeyPartA,
        string calldata encryptedKeyPartB,
        uint256 timerDuration,
        address[] calldata beneficiaries
    ) external {
        if (vaults[msg.sender].exists) revert VaultAlreadyExists();
        if (!_isAllowedTimer(timerDuration)) revert InvalidTimer();
        if (bytes(ipfsHash).length == 0) revert InvalidIpfsHash();
        if (bytes(encryptedKeyPartA).length == 0 || bytes(encryptedKeyPartB).length == 0) {
            revert InvalidDecryptionKey();
        }
        if (beneficiaries.length == 0) revert EmptyBeneficiaries();

        _validateBeneficiaries(beneficiaries);

        Vault storage vault = vaults[msg.sender];
        vault.exists = true;
        vault.owner = msg.sender;
        vault.ipfsHash = ipfsHash;
        vault.encryptedKeyPartA = encryptedKeyPartA;
        vault.encryptedKeyPartB = encryptedKeyPartB;
        vault.timerDuration = timerDuration;
        vault.createdAt = block.timestamp;
        vault.lastHeartbeat = block.timestamp;

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            vault.beneficiaries.push(beneficiaries[i]);
        }

        emit VaultCreated(msg.sender, ipfsHash, timerDuration);
    }

    function heartbeat() external {
        Vault storage vault = vaults[msg.sender];
        if (!vault.exists) revert VaultNotFound();
        if (vault.triggered) revert VaultAlreadyTriggered();
        if (block.timestamp > _deadline(vault)) revert VaultExpired();

        vault.lastHeartbeat = block.timestamp;
        emit HeartbeatSent(msg.sender, _deadline(vault));
    }

    function activateTrigger(address user) external {
        Vault storage vault = vaults[user];
        if (!vault.exists) revert VaultNotFound();
        if (vault.triggered) revert VaultAlreadyTriggered();
        if (block.timestamp <= _deadline(vault)) revert VaultStillActive();

        vault.triggered = true;
        vault.triggeredAt = block.timestamp;

        emit TriggerActivated(user, vault.ipfsHash, vault.encryptedKeyPartA, vault.encryptedKeyPartB);
    }

    function getVault(address user)
        external
        view
        returns (
            bool exists,
            address owner,
            string memory ipfsHash,
            string memory encryptedKeyPartA,
            string memory encryptedKeyPartB,
            uint256 timerDuration,
            uint256 createdAt,
            uint256 lastHeartbeat,
            uint256 deadline,
            bool triggered,
            uint256 triggeredAt,
            address[] memory beneficiaries
        )
    {
        Vault storage vault = vaults[user];
        return (
            vault.exists,
            vault.owner,
            vault.ipfsHash,
            vault.encryptedKeyPartA,
            vault.triggered ? vault.encryptedKeyPartB : "",
            vault.timerDuration,
            vault.createdAt,
            vault.lastHeartbeat,
            vault.exists ? _deadline(vault) : 0,
            vault.triggered,
            vault.triggeredAt,
            vault.beneficiaries
        );
    }

    function getStatus(address user) external view returns (Status) {
        Vault storage vault = vaults[user];
        if (!vault.exists) return Status.None;
        if (vault.triggered) return Status.Triggered;
        if (block.timestamp > _deadline(vault)) return Status.Expired;
        return Status.Active;
    }

    function nextDeadline(address user) external view returns (uint256) {
        Vault storage vault = vaults[user];
        if (!vault.exists) revert VaultNotFound();
        return _deadline(vault);
    }

    function hasVault(address user) external view returns (bool) {
        return vaults[user].exists;
    }

    function _deadline(Vault storage vault) private view returns (uint256) {
        return vault.lastHeartbeat + vault.timerDuration;
    }

    function _isAllowedTimer(uint256 timerDuration) private pure returns (bool) {
        return timerDuration == TIMER_7_DAYS || timerDuration == TIMER_14_DAYS || timerDuration == TIMER_30_DAYS;
    }

    function _validateBeneficiaries(address[] calldata beneficiaries) private pure {
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i] == address(0)) revert InvalidBeneficiary();
            for (uint256 j = i + 1; j < beneficiaries.length; j++) {
                if (beneficiaries[i] == beneficiaries[j]) revert DuplicateBeneficiary();
            }
        }
    }
}
