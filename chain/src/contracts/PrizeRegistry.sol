// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { IERC721 } from "openzeppelin/token/ERC721/IERC721.sol";
import { IERC1155 } from "openzeppelin/token/ERC1155/IERC1155.sol";
import { IERC20 } from "openzeppelin/token/ERC20/IERC20.sol";
import { ERC1155Holder } from "openzeppelin/token/ERC1155/utils/ERC1155Holder.sol";
import { ERC721Holder } from "openzeppelin/token/ERC721/utils/ERC721Holder.sol";
import { ReentrancyGuard } from "openzeppelin/utils/ReentrancyGuard.sol";
import { AccessControl } from "openzeppelin/access/AccessControl.sol";


contract PrizeRegistry is ERC1155Holder, ERC721Holder, ReentrancyGuard, AccessControl {

  bytes32 public constant PRIZE_REGISTRY_MANAGER = keccak256("PRIZE_REGISTRY_MANAGER");

  enum ERCType { ERC721, ERC1155, ERC20 }

  struct Ticket {
    address tokenAddress;
    uint256 tokenId;
  }

  struct Prize {
    ERCType ercType;
    address tokenAddress;
    address from;
    uint256 tokenId;
    uint256 amount;
    uint256 price;
  }

  event Deposit(ERCType ercType, address tokenAddress, address from, uint256 tokenId, uint256 amount, uint256 price);
  event Redeem(ERCType ercType, address tokenAddress, address to, uint256 tokenId, uint256 amount);

  Ticket public ticket;

  uint256 public prizeCount;
  mapping(uint256 => Prize) public availablePrizes;
  mapping(uint256 => Prize) public redeemedPrizes;

  constructor(address _admin, Ticket memory _ticket) {
    _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    _grantRole(PRIZE_REGISTRY_MANAGER, _admin);
    ticket = _ticket;
  }

  function deposit721(IERC721 _token, uint256 _tokenId, uint256 _price) external nonReentrant {
    require(_token.ownerOf(_tokenId) == msg.sender, "You do not own this token");
    require(_price > 0, "Price must be greater than 0");

    _token.safeTransferFrom(msg.sender, address(this), _tokenId);
    availablePrizes[prizeCount] = Prize({
        ercType: ERCType.ERC721,
        tokenAddress: address(_token),
        from: msg.sender,
        tokenId: _tokenId,
        amount: 1,
        price: _price
    });
    prizeCount++;

    emit Deposit(ERCType.ERC721, address(_token), msg.sender, _tokenId, 1, _price);
  }

  function deposit1155(IERC1155 _token, uint256 _tokenId, uint256 _amount, uint256 _price) external nonReentrant {
    require(_amount > 0 && _amount <= _token.balanceOf(msg.sender, _tokenId), "Invalid token amount");
    require(_price > 0, "Price must be greater than 0");

    _token.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");
    availablePrizes[prizeCount] = Prize({
        ercType: ERCType.ERC1155,
        tokenAddress: address(_token),
        from: msg.sender,
        tokenId: _tokenId,
        amount: _amount,
        price: _price
    });
    prizeCount++;

    emit Deposit(ERCType.ERC1155, address(_token), msg.sender, _tokenId, _amount, _price);
  }

  function deposit20(IERC20 _token, uint256 _amount, uint256 _price) external nonReentrant {
    require(_amount > 0 && _amount <= _token.balanceOf(msg.sender), "Invalid token amount");
    require(_price > 0, "Price must be greater than 0");

    _token.transferFrom(msg.sender, address(this), _amount);
    availablePrizes[prizeCount] = Prize({
        ercType: ERCType.ERC20,
        tokenAddress: address(_token),
        from: msg.sender,
        tokenId: 0,
        amount: _amount,
        price: _price
    });
    prizeCount++;

    emit Deposit(ERCType.ERC20, address(_token), msg.sender, 0, _amount, _price);
  }

  function redeem(uint256 _prizeId) public {
    require(availablePrizes[_prizeId].from != address(0), "Prize does not exist");
    require(availablePrizes[_prizeId].price <= IERC1155(ticket.tokenAddress).balanceOf(msg.sender, ticket.tokenId), "Insufficient ticket balance");

    if (availablePrizes[_prizeId].ercType == ERCType.ERC721) {
      IERC721(availablePrizes[_prizeId].tokenAddress).safeTransferFrom(address(this), msg.sender, availablePrizes[_prizeId].tokenId);
    } else if (availablePrizes[_prizeId].ercType == ERCType.ERC1155) {
      IERC1155(availablePrizes[_prizeId].tokenAddress).safeTransferFrom(address(this), msg.sender, availablePrizes[_prizeId].tokenId, availablePrizes[_prizeId].amount, "");
    } else if (availablePrizes[_prizeId].ercType == ERCType.ERC20) {
      IERC20(availablePrizes[_prizeId].tokenAddress).transfer(msg.sender, availablePrizes[_prizeId].amount);
    }

    redeemedPrizes[_prizeId] = availablePrizes[_prizeId];
    delete availablePrizes[_prizeId];

    emit Redeem(redeemedPrizes[_prizeId].ercType, redeemedPrizes[_prizeId].tokenAddress, msg.sender, redeemedPrizes[_prizeId].tokenId, redeemedPrizes[_prizeId].amount);
  }

  // @note manager withdraw should take in an ID an remove from the mapping to withdraw 
  function managerWithdraw721(IERC721 _token, uint256 _tokenId, address _to) external onlyRole(PRIZE_REGISTRY_MANAGER) {
    _token.safeTransferFrom(address(this), _to, _tokenId);
  }

  function managerWithdraw1155(IERC1155 _token, uint256 _tokenId, uint256 _amount, address _to) external onlyRole(PRIZE_REGISTRY_MANAGER) {
    _token.safeTransferFrom(address(this), _to, _tokenId, _amount, "");
  }

  function managerWithdraw20(IERC20 _token, uint256 _amount, address _to) external onlyRole(PRIZE_REGISTRY_MANAGER) {
    _token.transferFrom(address(this), _to, _amount);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Holder, AccessControl) returns (bool) {
    return ERC1155Holder.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
  }
}
