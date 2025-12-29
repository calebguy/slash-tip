// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "solmate/tokens/ERC20.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";

/// @title TipERC20
/// @notice ERC20 token representing tips
contract TipERC20 is ERC20, AccessControl {
    bytes32 public constant TIP_MINTER = keccak256("TIP_MINTER");

    constructor(
        address _admin,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol, _decimals) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIP_MINTER, _admin);
    }

    /// @notice Mint tokens to an address
    /// @param _to The recipient address
    /// @param _amount The amount to mint
    function mint(address _to, uint256 _amount) external onlyRole(TIP_MINTER) {
        _mint(_to, _amount);
    }

    /// @notice Burn tokens from an address (requires approval)
    /// @param _from The address to burn from
    /// @param _amount The amount to burn
    function burn(address _from, uint256 _amount) external onlyRole(TIP_MINTER) {
        _burn(_from, _amount);
    }

    /// @notice Check if the contract supports an interface
    /// @param interfaceId The interface ID
    /// @return True if supported
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
