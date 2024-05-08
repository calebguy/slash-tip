// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AccessControl } from "openzeppelin/access/AccessControl.sol";

contract UserRegistry is AccessControl {
    bytes32 USER_REGISTRY_MANAGER = keccak256("USER_REGISTRY_MANAGER");
    mapping(string => address) public users;
    mapping(address => uint256) public allowance;

    string public description;

    constructor(address _admin, string memory _description) {
      description = _description;
      _grantRole(DEFAULT_ADMIN_ROLE, _admin);
      _grantRole(USER_REGISTRY_MANAGER, _admin);
    }

    function addUser(string memory _id, address _address) public onlyRole(USER_REGISTRY_MANAGER) {
      users[_id] = _address;
    }

    // @note revert if user does not exist
    function removeUser(string memory _id) public onlyRole(USER_REGISTRY_MANAGER) {
      delete users[_id];
    }

    function getUser(string memory _id) public view returns (address) {
      return users[_id];
    }

    function setUserAllowance(string memory _id, uint256 _allowance) public onlyRole(USER_REGISTRY_MANAGER) {
      allowance[getUser(_id)] = _allowance;
    }

    function addUserAllowance(string memory _id, uint256 _plusAllowance) public onlyRole(USER_REGISTRY_MANAGER) {
      allowance[getUser(_id)] += _plusAllowance;
    }

    function subUserAllowance(string memory _id, uint256 _subAllowance) public onlyRole(USER_REGISTRY_MANAGER) {
      allowance[getUser(_id)] -= _subAllowance;
    }

    function getUserAllowance(string memory _id) public view returns (uint256) {
      return allowance[getUser(_id)];
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
      return super.supportsInterface(interfaceId);
    }
}
