// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IOpenCatzVault
 * @notice Interface for OpenCatz Liquidity Peg Vault on Robinhood Chain
 */
interface IOpenCatzVault {
    event NFTDeposited(address indexed user, uint256 indexed tokenId, uint256 tokensPaid, uint256 protocolFee);
    event NFTRedeemed(address indexed user, uint256 indexed tokenId, uint256 tokensReceived, uint256 protocolFee);
    event TokenAddressBound(address indexed tokenAddress);
    event RateUpdated(uint256 newRate);
    event SwapFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address indexed newTreasury);
    event PausedStateChanged(bool isPaused);

    function depositNFT(uint256 tokenId) external payable;
    function redeemNFT(uint256 tokenId) external payable;
    function setTokenAddress(address _tokenAddress) external;
    function setSwapFee(uint256 newFee) external;
    function setTreasury(address newTreasury) external;
    
    function getVaultInventory() external view returns (uint256[] memory);
    function getInventoryCount() external view returns (uint256);
    function isNFTInVault(uint256 tokenId) external view returns (bool);
    function tokensPerNFT() external view returns (uint256);
    function swapFee() external view returns (uint256);
    function treasury() external view returns (address);
    function tokenInitialized() external view returns (bool);
}
