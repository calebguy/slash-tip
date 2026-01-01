// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";
import {UserRegistry} from "./UserRegistry.sol";
import {ITipAction} from "./ITipAction.sol";

/// @title SlashTip
/// @notice Orchestrates tipping by validating allowances and executing tip actions
/// @dev Uses Initializable for beacon proxy pattern
contract SlashTip is Initializable, AccessControl {
    bytes32 public constant TIP_MANAGER = keccak256("TIP_MANAGER");

    string public orgId;
    UserRegistry public userRegistry;
    ITipAction public tipAction;

    event Tipped(
        string indexed fromId,
        string indexed toId,
        address indexed fromAddress,
        address toAddress,
        uint256 amount,
        string data,
        address actionContract
    );

    event TipActionUpdated(address indexed oldAction, address indexed newAction);
    event UserRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    error InsufficientAllowance(string userId, uint256 allowance, uint256 required);
    error UserNotFound(string userId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for proxy pattern)
    /// @param _admin The admin address
    /// @param _userRegistry The user registry contract address
    /// @param _tipAction The tip action contract address
    /// @param _orgId The organization ID
    function initialize(
        address _admin,
        address _userRegistry,
        address _tipAction,
        string memory _orgId
    ) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIP_MANAGER, _admin);

        userRegistry = UserRegistry(_userRegistry);
        tipAction = ITipAction(_tipAction);
        orgId = _orgId;
    }

    /// @notice Send a tip from one user to another
    /// @param _fromId The sender's external ID (e.g., Slack ID)
    /// @param _toId The recipient's external ID
    /// @param _amount The tip amount
    /// @param _data Additional data (e.g., tip message)
    function tip(
        string memory _fromId,
        string memory _toId,
        uint256 _amount,
        string memory _data
    ) external onlyRole(TIP_MANAGER) {
        // Validate sender exists and has sufficient allowance
        UserRegistry.User memory fromUser = userRegistry.getUser(_fromId);
        if (fromUser.allowance < _amount) {
            revert InsufficientAllowance(_fromId, fromUser.allowance, _amount);
        }

        // Deduct allowance
        userRegistry.subUserAllowance(_fromId, _amount);

        // Get recipient
        UserRegistry.User memory toUser = userRegistry.getUser(_toId);

        // Execute the tip action
        tipAction.execute(fromUser.account, toUser.account, _amount, bytes(_data));

        emit Tipped(
            _fromId,
            _toId,
            fromUser.account,
            toUser.account,
            _amount,
            _data,
            address(tipAction)
        );
    }

    /// @notice Get a user's remaining allowance
    /// @param _userId The external user ID
    /// @return The user's allowance
    function allowanceOf(string memory _userId) external view returns (uint256) {
        return userRegistry.getUser(_userId).allowance;
    }

    /// @notice Set allowance for all users
    /// @param _amount The allowance amount to set
    function setAllowanceForAllUsers(uint256 _amount) external onlyRole(TIP_MANAGER) {
        UserRegistry.User[] memory users = userRegistry.listUsers();
        for (uint256 i = 0; i < users.length; i++) {
            userRegistry.setUserAllowance(users[i].id, _amount);
        }
    }

    /// @notice Add allowance for all users
    /// @param _amount The allowance amount to add
    function addAllowanceForAllUsers(uint256 _amount) external onlyRole(TIP_MANAGER) {
        UserRegistry.User[] memory users = userRegistry.listUsers();
        for (uint256 i = 0; i < users.length; i++) {
            userRegistry.addUserAllowance(users[i].id, _amount);
        }
    }

    /// @notice Update the tip action contract
    /// @param _tipAction The new tip action contract address
    function setTipAction(address _tipAction) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldAction = address(tipAction);
        tipAction = ITipAction(_tipAction);
        emit TipActionUpdated(oldAction, _tipAction);
    }

    /// @notice Update the user registry contract
    /// @param _userRegistry The new user registry contract address
    function setUserRegistry(address _userRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldRegistry = address(userRegistry);
        userRegistry = UserRegistry(_userRegistry);
        emit UserRegistryUpdated(oldRegistry, _userRegistry);
    }
}
