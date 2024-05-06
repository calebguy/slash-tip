// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { ERC1155 } from "solmate/tokens/ERC1155.sol";
import { AccessControl } from "openzeppelin/access/AccessControl.sol";
import { Strings } from "openzeppelin/utils/Strings.sol";


contract Tip is ERC1155, AccessControl {
  using Strings for uint256;

  bytes32 TIP_MANAGER = keccak256("TIP_MANAGER");
  string public baseURI;

  constructor(address admin, string memory _baseURI) {
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(TIP_MANAGER, admin);
    baseURI = _baseURI;
  }

  function uri(uint256 _id) public view override returns (string memory) {
    return bytes(baseURI).length > 0
      ? string(abi.encodePacked(baseURI, _id.toString()))
      : "";
  }

  function setBaseURI(string memory _baseURI) public onlyRole(TIP_MANAGER) {
    baseURI = _baseURI;
    emit URI(baseURI, 0);
  }

  function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(TIP_MANAGER) {
    _mint(account, id, amount, data);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
