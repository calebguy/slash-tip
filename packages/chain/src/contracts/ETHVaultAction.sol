// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ITipAction} from "./ITipAction.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "openzeppelin/utils/ReentrancyGuard.sol";

/// @title ETHVaultAction
/// @notice Tip action that transfers native ETH from a vault to recipients
/// @dev Holds ETH and distributes it as tips. Uses Initializable for beacon proxy pattern.
contract ETHVaultAction is Initializable, ITipAction, AccessControl, ReentrancyGuard {
    // ============ INTERNAL ROLES ============
    /// @notice Role for executing tips (granted to SlashTip contract)
    bytes32 public constant EXECUTOR = keccak256("EXECUTOR");

    // ============ MANAGEMENT ROLES ============
    /// @notice Role for managing vault funds (withdraw, rescue)
    bytes32 public constant VAULT_MANAGER = keccak256("VAULT_MANAGER");

    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);

    error InsufficientVaultBalance(uint256 available, uint256 required);
    error ETHTransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for proxy pattern)
    /// @param _admin The admin address
    function initialize(address _admin) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(VAULT_MANAGER, _admin);
    }

    /// @notice Receive ETH deposits
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Execute the tip by transferring ETH from the vault
    /// @dev Only callable by addresses with EXECUTOR role (SlashTip contract)
    /// @dev Amount is in human-readable units (e.g., 1 for 1 ETH) and scaled to wei
    /// @param from The sender's wallet address (unused, tips come from vault)
    /// @param to The recipient's wallet address
    /// @param amount The amount of ETH to transfer (unscaled, e.g., 1 = 1 ETH)
    /// @param data Unused, kept for interface compatibility
    function execute(address from, address to, uint256 amount, bytes calldata data) external override onlyRole(EXECUTOR) nonReentrant {
        (from, data); // Silence unused parameter warnings

        // Scale amount to wei (1 ETH = 1e18 wei)
        uint256 scaledAmount = amount * 1e18;

        uint256 balance = address(this).balance;
        if (balance < scaledAmount) {
            revert InsufficientVaultBalance(balance, scaledAmount);
        }

        (bool success, ) = to.call{value: scaledAmount}("");
        if (!success) {
            revert ETHTransferFailed();
        }
    }

    /// @notice Deposit ETH into the vault
    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault (admin only)
    /// @param _to The address to send ETH to
    /// @param _amount The amount to withdraw (in wei)
    function withdraw(address _to, uint256 _amount) external onlyRole(VAULT_MANAGER) {
        (bool success, ) = _to.call{value: _amount}("");
        if (!success) {
            revert ETHTransferFailed();
        }
        emit Withdrawal(_to, _amount);
    }

    /// @notice Get the current vault balance
    /// @return The ETH balance of the vault (in wei)
    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Rescue ERC20 tokens accidentally sent to this contract
    /// @param _token The token to rescue
    /// @param _to The address to send tokens to
    /// @param _amount The amount to rescue
    function rescueTokens(address _token, address _to, uint256 _amount) external onlyRole(VAULT_MANAGER) {
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature("transfer(address,uint256)", _to, _amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");
    }
}
