// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/// @title ITipAction
/// @notice Interface for tip actions that execute when a tip is sent
interface ITipAction {
    /// @notice Execute the tip action
    /// @param from The sender's wallet address
    /// @param to The recipient's wallet address
    /// @param amount The tip amount
    /// @param data Additional data (e.g., tip message)
    function execute(address from, address to, uint256 amount, bytes calldata data) external;
}
