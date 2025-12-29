// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ITipAction} from "./ITipAction.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";

/// @title CustomCallAction
/// @notice Tip action that calls an arbitrary contract function
/// @dev The target function must accept (address to, uint256 amount, bytes data) parameters
contract CustomCallAction is ITipAction, AccessControl {
    bytes32 public constant ACTION_MANAGER = keccak256("ACTION_MANAGER");

    address public target;
    bytes4 public selector;

    event TargetUpdated(address indexed oldTarget, address indexed newTarget);
    event SelectorUpdated(bytes4 oldSelector, bytes4 newSelector);

    error CallFailed(bytes returnData);

    constructor(address _admin, address _target, bytes4 _selector) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ACTION_MANAGER, _admin);

        target = _target;
        selector = _selector;
    }

    /// @notice Execute the tip by calling the target contract
    /// @param from The sender's wallet address
    /// @param to The recipient's wallet address
    /// @param amount The tip amount
    /// @param data Additional data passed to the target function
    function execute(address from, address to, uint256 amount, bytes calldata data) external override {
        (bool success, bytes memory returnData) = target.call(
            abi.encodeWithSelector(selector, from, to, amount, data)
        );

        if (!success) {
            revert CallFailed(returnData);
        }
    }

    /// @notice Update the target contract
    /// @param _target The new target contract address
    function setTarget(address _target) external onlyRole(ACTION_MANAGER) {
        address oldTarget = target;
        target = _target;
        emit TargetUpdated(oldTarget, _target);
    }

    /// @notice Update the function selector
    /// @param _selector The new function selector
    function setSelector(bytes4 _selector) external onlyRole(ACTION_MANAGER) {
        bytes4 oldSelector = selector;
        selector = _selector;
        emit SelectorUpdated(oldSelector, _selector);
    }
}
