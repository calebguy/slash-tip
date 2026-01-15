// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ITipAction} from "./ITipAction.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "openzeppelin/utils/ReentrancyGuard.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "openzeppelin/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";

/// @title ERC20VaultAction
/// @notice Tip action that transfers ERC20 tokens from a vault to recipients
/// @dev Holds ERC20 tokens and distributes them as tips. Uses Initializable for beacon proxy pattern.
contract ERC20VaultAction is Initializable, ITipAction, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ INTERNAL ROLES ============
    /// @notice Role for executing tips (granted to SlashTip contract)
    bytes32 public constant EXECUTOR = keccak256("EXECUTOR");

    // ============ MANAGEMENT ROLES ============
    /// @notice Role for managing vault funds (withdraw, rescue, set token)
    bytes32 public constant VAULT_MANAGER = keccak256("VAULT_MANAGER");

    IERC20 public token;

    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);
    event TokenUpdated(address indexed oldToken, address indexed newToken);

    error InsufficientVaultBalance(uint256 available, uint256 required);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for proxy pattern)
    /// @param _admin The admin address
    /// @param _token The ERC20 token contract address
    function initialize(address _admin, address _token) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(VAULT_MANAGER, _admin);

        token = IERC20(_token);
    }

    /// @notice Execute the tip by transferring ERC20 tokens from the vault
    /// @dev Only callable by addresses with EXECUTOR role (SlashTip contract)
    /// @dev Amount is in human-readable units (e.g., 1 for 1 token) and scaled by token decimals
    /// @param from The sender's wallet address (unused, tips come from vault)
    /// @param to The recipient's wallet address
    /// @param amount The number of tokens to transfer (unscaled, e.g., 1 = 1 token)
    /// @param data Unused, kept for interface compatibility
    function execute(address from, address to, uint256 amount, bytes calldata data) external override onlyRole(EXECUTOR) nonReentrant {
        (from, data); // Silence unused parameter warnings

        // Scale amount by token decimals (e.g., 1 becomes 1e18 for 18-decimal token)
        uint8 decimals = IERC20Metadata(address(token)).decimals();
        uint256 scaledAmount = amount * (10 ** decimals);

        uint256 balance = token.balanceOf(address(this));
        if (balance < scaledAmount) {
            revert InsufficientVaultBalance(balance, scaledAmount);
        }

        token.safeTransfer(to, scaledAmount);
    }

    /// @notice Deposit ERC20 tokens into the vault
    /// @param _amount The amount to deposit
    function deposit(uint256 _amount) external {
        token.safeTransferFrom(msg.sender, address(this), _amount);
        emit Deposit(msg.sender, _amount);
    }

    /// @notice Withdraw ERC20 tokens from the vault (admin only)
    /// @param _to The address to send tokens to
    /// @param _amount The amount to withdraw
    function withdraw(address _to, uint256 _amount) external onlyRole(VAULT_MANAGER) {
        token.safeTransfer(_to, _amount);
        emit Withdrawal(_to, _amount);
    }

    /// @notice Get the current vault balance
    /// @return The token balance of the vault
    function vaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Update the token contract (admin only)
    /// @param _token The new token contract address
    function setToken(address _token) external onlyRole(VAULT_MANAGER) {
        address oldToken = address(token);
        token = IERC20(_token);
        emit TokenUpdated(oldToken, _token);
    }

    /// @notice Rescue tokens accidentally sent to this contract
    /// @param _token The token to rescue (can be different from vault token)
    /// @param _to The address to send tokens to
    /// @param _amount The amount to rescue
    function rescueTokens(address _token, address _to, uint256 _amount) external onlyRole(VAULT_MANAGER) {
        IERC20(_token).safeTransfer(_to, _amount);
    }
}
