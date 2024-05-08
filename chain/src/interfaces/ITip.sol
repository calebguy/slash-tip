// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface ITip {
  function mint(address account, uint256 id, uint256 amount, bytes memory data) external;
  function balanceOf(address account, uint256 id) external view returns (uint256);
}
