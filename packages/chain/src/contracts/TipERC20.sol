// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Initializable} from "openzeppelin/proxy/utils/Initializable.sol";

/// @title TipERC20
/// @notice ERC20 token representing tips
/// @dev Uses Initializable for beacon proxy pattern
contract TipERC20 is Initializable, ERC20, AccessControl {
    bytes32 public constant TIP_MINTER = keccak256("TIP_MINTER");

    uint8 private _decimals;
    string private _tokenName;
    string private _tokenSymbol;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() ERC20("", "") {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for proxy pattern)
    /// @param _admin The admin address
    /// @param name_ The token name
    /// @param symbol_ The token symbol
    /// @param decimals_ The token decimals
    function initialize(
        address _admin,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIP_MINTER, _admin);

        _tokenName = name_;
        _tokenSymbol = symbol_;
        _decimals = decimals_;
    }

    /// @notice Returns the name of the token
    function name() public view override returns (string memory) {
        return _tokenName;
    }

    /// @notice Returns the symbol of the token
    function symbol() public view override returns (string memory) {
        return _tokenSymbol;
    }

    /// @notice Returns the number of decimals
    function decimals() public view override returns (uint8) {
        return _decimals;
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
