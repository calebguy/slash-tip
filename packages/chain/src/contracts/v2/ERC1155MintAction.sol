// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ITipAction} from "./ITipAction.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";

/// @notice Interface for mintable ERC1155 tokens
interface IERC1155Mintable {
    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external;
}

/// @title ERC1155MintAction
/// @notice Tip action that mints ERC1155 tokens to the recipient
contract ERC1155MintAction is ITipAction, AccessControl {
    bytes32 public constant ACTION_MANAGER = keccak256("ACTION_MANAGER");

    IERC1155Mintable public token;
    uint256 public tokenId;

    event TokenUpdated(address indexed oldToken, address indexed newToken);
    event TokenIdUpdated(uint256 oldTokenId, uint256 newTokenId);

    constructor(address _admin, address _token, uint256 _tokenId) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ACTION_MANAGER, _admin);

        token = IERC1155Mintable(_token);
        tokenId = _tokenId;
    }

    /// @notice Execute the tip by minting ERC1155 tokens
    /// @param from The sender's wallet address (unused for minting)
    /// @param to The recipient's wallet address
    /// @param amount The number of tokens to mint
    /// @param data Additional data passed to the mint function
    function execute(address from, address to, uint256 amount, bytes calldata data) external override {
        (from); // Silence unused parameter warning
        token.mint(to, tokenId, amount, data);
    }

    /// @notice Update the token contract
    /// @param _token The new token contract address
    function setToken(address _token) external onlyRole(ACTION_MANAGER) {
        address oldToken = address(token);
        token = IERC1155Mintable(_token);
        emit TokenUpdated(oldToken, _token);
    }

    /// @notice Update the token ID
    /// @param _tokenId The new token ID
    function setTokenId(uint256 _tokenId) external onlyRole(ACTION_MANAGER) {
        uint256 oldTokenId = tokenId;
        tokenId = _tokenId;
        emit TokenIdUpdated(oldTokenId, _tokenId);
    }
}
