// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { AccessControl } from "openzeppelin/access/AccessControl.sol";
import { UserRegistry } from "../contracts/UserRegistry.sol";
import { Tip } from "../contracts/Tip.sol";

contract SlashTip is AccessControl {
    bytes32 SLASH_TIP_MANAGER = keccak256("SLASH_TIP_MANAGER");
    string public description;
    
    UserRegistry public userRegistry;
    Tip public tipToken;

    constructor(address _admin, address _userRegistry, address _tipToken, string memory _description) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admin);
      _grantRole(SLASH_TIP_MANAGER, _admin);
      
      userRegistry = UserRegistry(_userRegistry);
      tipToken = Tip(_tipToken);

      description = _description;
    }

    function setUserRegistry(address _userRegistry) public onlyRole(SLASH_TIP_MANAGER) {
      userRegistry = UserRegistry(_userRegistry);
    }

    function setTipToken(address _tipToken) public onlyRole(SLASH_TIP_MANAGER) {
      tipToken = Tip(_tipToken);
    }

    function tip(string memory _fromId, string memory _toId, uint256 _tokenId, uint256 _amount) public onlyRole(SLASH_TIP_MANAGER) {
      // from user must be registered
      UserRegistry.User memory fromUser = userRegistry.getUser(_fromId);

      // sender must have enough balance
      require(fromUser.allowance >= _amount, "Insufficient allowance to mint");

      // deduct allowance
      userRegistry.subUserAllowance(_fromId, _amount);

      // to user must be registered
      UserRegistry.User memory toUser = userRegistry.getUser(_toId);

      // mint tip token to recipient
      tipToken.mint(toUser.account, _tokenId, _amount, "");
    }

    function balanceOf(string memory _userId, uint256 _tokenId) public view returns (uint256) {
      return tipToken.balanceOf(userRegistry.getUser(_userId).account, _tokenId);
    }

    function allowanceOf(string memory _userId) public view returns (uint256) {
      return userRegistry.getUser(_userId).allowance;
    }
}
