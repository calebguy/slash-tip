// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AccessControl } from "openzeppelin/access/AccessControl.sol";

contract UserRegistry is AccessControl {
    struct User {
      string nickname;
      address account;
      uint256 allowance;
    }

    bytes32 USER_REGISTRY_MANAGER = keccak256("USER_REGISTRY_MANAGER");
    mapping(string => User) public idToUser;

    string public description;

    constructor(address _admin, string memory _description) {
      description = _description;
      _grantRole(DEFAULT_ADMIN_ROLE, _admin);
      _grantRole(USER_REGISTRY_MANAGER, _admin);
    }

    function getUser(string memory _id) public view returns (User memory) {
      User memory user = idToUser[_id];
      require(user.account != address(0), "User does not exist");
  
      return user;
    }

    function _getUser(string memory _id) internal view returns (User storage) {
      User storage user = idToUser[_id];
      require(user.account != address(0), "User does not exist");
  
      return user;
    }

    function addUser(string memory _id, User calldata _user) public onlyRole(USER_REGISTRY_MANAGER) {
      idToUser[_id] = _user;
    }

    function removeUser(string memory _id) public onlyRole(USER_REGISTRY_MANAGER) {
      _getUser(_id);
      delete idToUser[_id];
    }

    function getUserAddress(string memory _id) public view returns (address) {
      return _getUser(_id).account;
    }

    function getUserAllowance(string memory _id) public view returns (uint256) {
      return _getUser(_id).allowance;
    }

    function setUserAllowance(string memory _id, uint256 _allowance) public onlyRole(USER_REGISTRY_MANAGER) {
      _getUser(_id).allowance = _allowance;
    }

    function addUserAllowance(string memory _id, uint256 _plus) public onlyRole(USER_REGISTRY_MANAGER) {
      _getUser(_id).allowance += _plus;
    }

    function subUserAllowance(string memory _id, uint256 _sub) public onlyRole(USER_REGISTRY_MANAGER) {
      User storage user = _getUser(_id);
      uint256 newAllowance = user.allowance - _sub;
      require(newAllowance >= 0, "Cannot give a user a negative allownace");
      
      user.allowance = newAllowance;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
      return super.supportsInterface(interfaceId);
    }
}
