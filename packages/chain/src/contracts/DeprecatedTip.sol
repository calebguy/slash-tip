// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC1155} from "solmate/tokens/ERC1155.sol";
import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {Strings} from "openzeppelin/utils/Strings.sol";

/// @notice DEPRECATED: This is the legacy V1 tip token contract. Use TipERC1155 or TipERC20 instead.
contract DeprecatedTip is ERC1155, AccessControl {
    using Strings for uint256;

    bytes32 TIP_MANAGER = keccak256("TIP_MANAGER");
    string public baseURI;

    constructor(address _admin, string memory _baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIP_MANAGER, _admin);
        baseURI = _baseURI;
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, _id.toString())) : "";
    }

    function setBaseURI(string memory _baseURI) public onlyRole(TIP_MANAGER) {
        baseURI = _baseURI;
        emit URI(baseURI, 0);
    }

    function mint(address _account, uint256 _id, uint256 _amount, bytes memory _data) public onlyRole(TIP_MANAGER) {
        _mint(_account, _id, _amount, _data);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
