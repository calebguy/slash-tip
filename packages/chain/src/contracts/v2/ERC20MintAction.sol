// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ITipAction} from "./ITipAction.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";

/// @notice Interface for mintable ERC20 tokens
interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
}

/// @title ERC20MintAction
/// @notice Tip action that mints ERC20 tokens to the recipient
/// @dev Uses Initializable for beacon proxy pattern
contract ERC20MintAction is Initializable, ITipAction, AccessControl {
    bytes32 public constant ACTION_MANAGER = keccak256("ACTION_MANAGER");

    IERC20Mintable public token;

    event TokenUpdated(address indexed oldToken, address indexed newToken);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for proxy pattern)
    /// @param _admin The admin address
    /// @param _token The ERC20 token contract address
    function initialize(address _admin, address _token) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ACTION_MANAGER, _admin);

        token = IERC20Mintable(_token);
    }

    /// @notice Execute the tip by minting ERC20 tokens
    /// @param from The sender's wallet address (unused for minting)
    /// @param to The recipient's wallet address
    /// @param amount The number of tokens to mint
    /// @param data Unused, kept for interface compatibility
    function execute(address from, address to, uint256 amount, bytes calldata data) external override {
        (from, data); // Silence unused parameter warnings
        token.mint(to, amount);
    }

    /// @notice Update the token contract
    /// @param _token The new token contract address
    function setToken(address _token) external onlyRole(ACTION_MANAGER) {
        address oldToken = address(token);
        token = IERC20Mintable(_token);
        emit TokenUpdated(oldToken, _token);
    }
}
