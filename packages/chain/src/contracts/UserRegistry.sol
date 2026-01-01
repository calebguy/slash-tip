// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";

/// @title UserRegistry
/// @notice Maps external user IDs (e.g., Slack IDs) to wallet addresses and manages allowances
/// @dev Uses Initializable for beacon proxy pattern
contract UserRegistry is Initializable, AccessControl {
    bytes32 public constant REGISTRY_MANAGER = keccak256("REGISTRY_MANAGER");

    struct User {
        string id;
        string nickname;
        address account;
        uint256 allowance;
    }

    string public orgId;
    mapping(string => User) public users;
    string[] public userIds;

    event UserAdded(string indexed id, string nickname, address indexed account);
    event UserRemoved(string indexed id);
    event AllowanceUpdated(string indexed id, uint256 oldAllowance, uint256 newAllowance);

    error UserNotFound(string id);
    error UserAlreadyExists(string id);
    error InvalidUser();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for proxy pattern)
    /// @param _admin The admin address
    /// @param _orgId The organization ID
    function initialize(address _admin, string memory _orgId) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRY_MANAGER, _admin);
        orgId = _orgId;
    }

    /// @notice Get a user by their external ID
    /// @param _id The external user ID (e.g., Slack ID)
    /// @return The user struct
    function getUser(string memory _id) public view returns (User memory) {
        User storage user = users[_id];
        if (user.account == address(0)) {
            revert UserNotFound(_id);
        }
        return user;
    }

    /// @notice Check if a user exists
    /// @param _id The external user ID
    /// @return True if the user exists
    function userExists(string memory _id) public view returns (bool) {
        return users[_id].account != address(0);
    }

    /// @notice Add a new user
    /// @param _id The external user ID
    /// @param _user The user data
    function addUser(string memory _id, User calldata _user) external onlyRole(REGISTRY_MANAGER) {
        if (_user.account == address(0)) revert InvalidUser();
        if (bytes(_user.nickname).length == 0) revert InvalidUser();
        if (users[_id].account != address(0)) revert UserAlreadyExists(_id);

        users[_id] = _user;
        userIds.push(_id);

        emit UserAdded(_id, _user.nickname, _user.account);
    }

    /// @notice Remove a user
    /// @param _id The external user ID
    function removeUser(string memory _id) external onlyRole(REGISTRY_MANAGER) {
        if (users[_id].account == address(0)) revert UserNotFound(_id);

        delete users[_id];

        // Remove from userIds array
        for (uint256 i = 0; i < userIds.length; i++) {
            if (keccak256(bytes(userIds[i])) == keccak256(bytes(_id))) {
                userIds[i] = userIds[userIds.length - 1];
                userIds.pop();
                break;
            }
        }

        emit UserRemoved(_id);
    }

    /// @notice List all users
    /// @return Array of all users
    function listUsers() external view returns (User[] memory) {
        User[] memory result = new User[](userIds.length);
        for (uint256 i = 0; i < userIds.length; i++) {
            result[i] = users[userIds[i]];
        }
        return result;
    }

    /// @notice Get the number of users
    /// @return The user count
    function userCount() external view returns (uint256) {
        return userIds.length;
    }

    /// @notice Get a user's wallet address
    /// @param _id The external user ID
    /// @return The user's wallet address
    function getUserAddress(string memory _id) external view returns (address) {
        User storage user = users[_id];
        if (user.account == address(0)) revert UserNotFound(_id);
        return user.account;
    }

    /// @notice Get a user's allowance
    /// @param _id The external user ID
    /// @return The user's allowance
    function getUserAllowance(string memory _id) external view returns (uint256) {
        User storage user = users[_id];
        if (user.account == address(0)) revert UserNotFound(_id);
        return user.allowance;
    }

    /// @notice Set a user's allowance
    /// @param _id The external user ID
    /// @param _allowance The new allowance
    function setUserAllowance(string memory _id, uint256 _allowance) external onlyRole(REGISTRY_MANAGER) {
        User storage user = users[_id];
        if (user.account == address(0)) revert UserNotFound(_id);

        uint256 oldAllowance = user.allowance;
        user.allowance = _allowance;

        emit AllowanceUpdated(_id, oldAllowance, _allowance);
    }

    /// @notice Add to a user's allowance
    /// @param _id The external user ID
    /// @param _amount The amount to add
    function addUserAllowance(string memory _id, uint256 _amount) external onlyRole(REGISTRY_MANAGER) {
        User storage user = users[_id];
        if (user.account == address(0)) revert UserNotFound(_id);

        uint256 oldAllowance = user.allowance;
        user.allowance += _amount;

        emit AllowanceUpdated(_id, oldAllowance, user.allowance);
    }

    /// @notice Subtract from a user's allowance
    /// @param _id The external user ID
    /// @param _amount The amount to subtract
    function subUserAllowance(string memory _id, uint256 _amount) external onlyRole(REGISTRY_MANAGER) {
        User storage user = users[_id];
        if (user.account == address(0)) revert UserNotFound(_id);

        uint256 oldAllowance = user.allowance;
        require(user.allowance >= _amount, "Insufficient allowance");
        user.allowance -= _amount;

        emit AllowanceUpdated(_id, oldAllowance, user.allowance);
    }
}
