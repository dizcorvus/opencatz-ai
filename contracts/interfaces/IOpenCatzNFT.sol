// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IOpenCatzNFT
 * @notice Interface for OpenCatz NFT Collection (ERC-721 + ERC-2981 Royalty)
 */
interface IOpenCatzNFT {
    // ERC-721 Core
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function totalSupply() external view returns (uint256);
    function maxSupply() external view returns (uint256);

    // EIP-2981 Royalty
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);

    // Minting
    function mint(address to) external payable returns (uint256);
    function batchMint(address to, uint256 quantity) external payable;
}
