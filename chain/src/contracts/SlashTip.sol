// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AccessControl } from "openzeppelin/access/AccessControl.sol";
import { IUserRegistry } from "../interfaces/IUserRegistry.sol";
import { ITip } from "../interfaces/ITip.sol";

contract SlashTip is AccessControl {
    bytes32 SLASH_TIP_MANAGER = keccak256("SLASH_TIP_MANAGER");
    string public description;
    
    IUserRegistry public userRegistry;
    ITip public tipToken;

    constructor(address _admin, address _userRegistry, address _tipToken, string memory _description) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admin);
      _grantRole(SLASH_TIP_MANAGER, _admin);
      
      userRegistry = IUserRegistry(_userRegistry);
      tipToken = ITip(_tipToken);

      description = _description;
    }

    function tip(string memory _userId, uint256 _tokenId, uint256 _amount) public onlyRole(SLASH_TIP_MANAGER) {
      address user = userRegistry.getUser(_userId);
      require(user != address(0), "User not found");

      uint256 allowance = userRegistry.getUserAllowance(_userId);
      require(allowance >= _amount, "Insufficient allowance");

      tipToken.mint(user, _tokenId, _amount, "");
    }

    function setUserRegistry(address _userRegistry) public onlyRole(SLASH_TIP_MANAGER) {
      userRegistry = IUserRegistry(_userRegistry);
    }

    function setTipToken(address _tipToken) public onlyRole(SLASH_TIP_MANAGER) {
      tipToken = ITip(_tipToken);
    }

    function userBalance(string memory _userId, uint256 _tokenId) public view returns (uint256) {
      address userAddress = userRegistry.getUser(_userId);
      return tipToken.balanceOf(userAddress, _tokenId);
    }
}
