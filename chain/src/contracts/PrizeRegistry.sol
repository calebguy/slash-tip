// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { IERC721 } from "openzeppelin/token/ERC721/IERC721.sol";
import { IERC1155 } from "openzeppelin/token/ERC1155/IERC1155.sol";
import { IERC20 } from "openzeppelin/token/ERC20/IERC20.sol";
import { ERC1155Holder } from "openzeppelin/token/ERC1155/utils/ERC1155Holder.sol";
import { ERC721Holder } from "openzeppelin/token/ERC721/utils/ERC721Holder.sol";
import { ReentrancyGuard } from "openzeppelin/utils/ReentrancyGuard.sol";

contract PrizeRegistry is ERC1155Holder, ERC721Holder, ReentrancyGuard {

  struct Prize {
    string ercType; // ERC721 | ERC1155 | ERC20
    address tokenAddress;
    address from;
    uint256 tokenId;
    uint256 amount;
    uint256 price;
  }

  event Deposit(string ercType, address tokenAddress, address from, uint256 tokenId, uint256 amount, uint256 price);

  Prize[] public prizes;

  function deposit721(IERC721 _token, uint256 _tokenId, uint256 _price) external nonReentrant {
    require(_token.ownerOf(_tokenId) == msg.sender, "You do not own this token");
    require(_price > 0, "Price must be greater than 0");

    _token.safeTransferFrom(msg.sender, address(this), _tokenId);
    prizes.push(Prize({
      ercType: "ERC721",
      tokenAddress: address(_token),
      from: msg.sender,
      tokenId: _tokenId,
      amount: 1,
      price: _price
    }));


    emit Deposit("ERC721", address(_token), msg.sender, _tokenId, 1, _price);
  }

  function deposit1155(IERC1155 _token, uint256 _tokenId, uint256 _amount, uint256 _price) external nonReentrant {
    require(_amount <= _token.balanceOf(msg.sender, _tokenId), "You do not have enough of this token");
    require(_price > 0, "Price must be greater than 0");

    _token.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");
    prizes.push(Prize({
      ercType: "ERC1155",
      tokenAddress: address(_token),
      from: msg.sender,
      tokenId: _tokenId,
      amount: _amount,
      price: _price
    }));

    emit Deposit("ERC1155", address(_token), msg.sender, _tokenId, _amount, _price);
  }

  function deposit20(IERC20 _token, uint256 _amount, uint256 _price) external nonReentrant {
    require(_amount <= _token.balanceOf(msg.sender), "You do not have enough of this token");
    require(_price > 0, "Price must be greater than 0");

    _token.transferFrom(msg.sender, address(this), _amount);
    prizes.push(Prize({
      ercType: "ERC20",
      tokenAddress: address(_token),
      from: msg.sender,
      tokenId: 0,
      amount: _amount,
      price: _price
    }));

    emit Deposit("ERC20", address(_token), msg.sender, 0, _amount, _price);
  }
}
