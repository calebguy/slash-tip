// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {UserRegistry} from "../contracts/UserRegistry.sol";
import {Tip} from "../contracts/Tip.sol";

contract SlashTip is AccessControl {
    bytes32 SLASH_TIP_MANAGER = keccak256("SLASH_TIP_MANAGER");
    string public description;

    UserRegistry public userRegistry;
    Tip public tipToken;

    event Tipped(
        string fromId,
        string toId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount,
        string data
    );

    struct UserWithBalance {
        UserRegistry.User user;
        uint256 balance;
    }

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

    function tip(string memory _fromId, string memory _toId, uint256 _tokenId, uint256 _amount, string memory _data)
        public
        onlyRole(SLASH_TIP_MANAGER)
    {
        // from user must be registered
        UserRegistry.User memory fromUser = userRegistry.getUser(_fromId);

        // sender must have enough balance
        require(fromUser.allowance >= _amount, "Insufficient allowance to mint");

        // deduct allowance
        userRegistry.subUserAllowance(_fromId, _amount);

        // to user must be registered
        UserRegistry.User memory toUser = userRegistry.getUser(_toId);

        // mint tip token to recipient
        tipToken.mint(toUser.account, _tokenId, _amount, bytes(_data));

        emit Tipped(_fromId, _toId, fromUser.account, toUser.account, _tokenId, _amount, _data);
    }

    function balanceOf(string memory _userId, uint256 _tokenId) public view returns (uint256) {
        return tipToken.balanceOf(userRegistry.getUser(_userId).account, _tokenId);
    }

    function allowanceOf(string memory _userId) public view returns (uint256) {
        return userRegistry.getUser(_userId).allowance;
    }

    function leaderboard(uint256 _tokenId) public view returns (UserWithBalance[] memory) {
        UserRegistry.User[] memory users = userRegistry.listUsers();
        UserWithBalance[] memory usersWithBalance = new UserWithBalance[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            usersWithBalance[i].user = users[i];
            usersWithBalance[i].balance = tipToken.balanceOf(users[i].account, _tokenId);
        }

        // sort the usersWithBalance array by the balance desdending
        for (uint256 i = 0; i < usersWithBalance.length; i++) {
            for (uint256 j = i + 1; j < usersWithBalance.length; j++) {
                if (usersWithBalance[i].balance < usersWithBalance[j].balance) {
                    UserWithBalance memory temp = usersWithBalance[i];
                    usersWithBalance[i] = usersWithBalance[j];
                    usersWithBalance[j] = temp;
                }
            }
        }
        return usersWithBalance;
    }

    function setAllowanceForAllUsers(uint256 _amount) public onlyRole(SLASH_TIP_MANAGER) {
        UserRegistry.User[] memory users = userRegistry.listUsers();
        for (uint256 i = 0; i < users.length; i++) {
            userRegistry.setUserAllowance(users[i].id, _amount);
        }
    }

    function addAllowanceForAllUsers(uint256 _amount) public onlyRole(SLASH_TIP_MANAGER) {
        UserRegistry.User[] memory users = userRegistry.listUsers();
        for (uint256 i = 0; i < users.length; i++) {
            userRegistry.addUserAllowance(users[i].id, _amount);
        }
    }
}
