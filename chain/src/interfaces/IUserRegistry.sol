// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IUserRegistry {
    function users(string memory) external view returns (address);
    function allowance(address) external view returns (uint256);
    function addUser(string memory, address) external;
    function removeUser(string memory) external;
    function getUserAddress(string memory) external view returns (address);
    function setUserAllowance(string memory, uint256) external;
    function addUserAllowance(string memory, uint256) external;
    function subUserAllowance(string memory, uint256) external;
    function getUserAllowance(string memory) external view returns (uint256);
}
