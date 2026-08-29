// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IOpenCatzVault
 * @notice Interface for OpenCatz Liquidity Peg Vault on Robinhood Chain
 */
interface IOpenCatzVault {
    event NFTDeposited(address indexed user, uint256 indexed tokenId, uint256 tokensPaid);
    event NFTRedeemed(address indexed user, uint256 indexed tokenId, uint256 tokensReceived);
    event TierActivated(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 feePaid, uint256 tokensBurned);
    event RateUpdated(uint256 newRate);
    event PlatformFeeUpdated(uint256 newFee);

    function depositNFT(uint256 tokenId) external;
    function redeemNFT(uint256 tokenId) external;
    function activateTier(uint256 tokenId, uint8 targetTier) external;
    
    function getVaultInventory() external view returns (uint256[] memory);
    function getInventoryCount() external view returns (uint256);
    function isNFTInVault(uint256 tokenId) external view returns (bool);
    function nftTier(uint256 tokenId) external view returns (uint8);
    function tokensPerNFT() external view returns (uint256);
    function totalBurned() external view returns (uint256);
}
