// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC1155} from "solmate/tokens/ERC1155.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Strings} from "openzeppelin/utils/Strings.sol";

/// @title TipERC1155
/// @notice ERC1155 token representing tips
contract TipERC1155 is ERC1155, AccessControl {
    using Strings for uint256;

    bytes32 public constant TIP_MINTER = keccak256("TIP_MINTER");

    string public baseURI;
    string public contractURI;

    event BaseURIUpdated(string oldURI, string newURI);
    event ContractURIUpdated(string oldURI, string newURI);

    constructor(address _admin, string memory _baseURI, string memory _contractURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIP_MINTER, _admin);

        baseURI = _baseURI;
        contractURI = _contractURI;
    }

    /// @notice Get the URI for a token ID
    /// @param _id The token ID
    /// @return The token URI
    function uri(uint256 _id) public view override returns (string memory) {
        return bytes(baseURI).length > 0
            ? string(abi.encodePacked(baseURI, _id.toString()))
            : "";
    }

    /// @notice Mint tokens to an address
    /// @param _to The recipient address
    /// @param _id The token ID
    /// @param _amount The amount to mint
    /// @param _data Additional data
    function mint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) external onlyRole(TIP_MINTER) {
        _mint(_to, _id, _amount, _data);
    }

    /// @notice Batch mint tokens to an address
    /// @param _to The recipient address
    /// @param _ids The token IDs
    /// @param _amounts The amounts to mint
    /// @param _data Additional data
    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) external onlyRole(TIP_MINTER) {
        _batchMint(_to, _ids, _amounts, _data);
    }

    /// @notice Update the base URI
    /// @param _baseURI The new base URI
    function setBaseURI(string memory _baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = baseURI;
        baseURI = _baseURI;
        emit BaseURIUpdated(oldURI, _baseURI);
    }

    /// @notice Update the contract URI (collection-level metadata)
    /// @param _contractURI The new contract URI
    function setContractURI(string memory _contractURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = contractURI;
        contractURI = _contractURI;
        emit ContractURIUpdated(oldURI, _contractURI);
    }

    /// @notice Check if the contract supports an interface
    /// @param interfaceId The interface ID
    /// @return True if supported
    function supportsInterface(bytes4 interfaceId)
        public
        pure
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return
            interfaceId == 0xd9b67a26 || // ERC1155
            interfaceId == 0x0e89341c || // ERC1155MetadataURI
            interfaceId == 0x01ffc9a7;   // ERC165
    }
}
