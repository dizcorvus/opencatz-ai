// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IOpenCatzNFT.sol";

interface IERC20Minimal {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
}

/**
 * @title OpenCatzVault
 * @notice Central Liquidity Peg & Deflationary Burn Vault for OpenCatz Ecosystem
 * @dev Deployed on Robinhood Chain (Chain ID: 4663)
 *      - Holds 50% $CATZ token reserves from letscash.fun
 *      - Enables trustless 1:1 / trait-weighted NFT ◄──► $CATZ swaps
 *      - Manages Tier Activation with 50% permanent burn to 0x000...dead
 */
contract OpenCatzVault {
    address public owner;
    IOpenCatzNFT public immutable catzNFT;
    IERC20Minimal public immutable catzToken;

    // Constants
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 public tokensPerNFT = 100_000 * 1e18; // 1 Catz NFT = 100,000 $CATZ (18 decimals)
    
    // Tier Activation Pricing in $CATZ (18 decimals)
    uint256 public tier1Fee = 10_000 * 1e18;
    uint256 public tier2Fee = 25_000 * 1e18;
    uint256 public tier3Fee = 50_000 * 1e18;
    uint256 public tier4Fee = 100_000 * 1e18; // 9-Lives Tier

    // State Tracking
    uint256 public totalBurnedTokens;
    uint256 public totalRewardPot;
    bool public paused = false;

    // Vault NFT Inventory
    uint256[] private _inventoryTokens;
    mapping(uint256 => uint256) private _inventoryIndex; // tokenId -> array index + 1
    mapping(uint256 => uint8) public nftTier;             // tokenId -> tier (0=Basic, 1, 2, 3, 4=9-Lives)

    // Reentrancy guard
    uint8 private _unlocked = 1;

    // Events
    event NFTDeposited(address indexed user, uint256 indexed tokenId, uint256 tokensPaid);
    event NFTRedeemed(address indexed user, uint256 indexed tokenId, uint256 tokensReceived);
    event TierActivated(address indexed user, uint256 indexed tokenId, uint8 tier, uint256 feePaid, uint256 tokensBurned);
    event RateUpdated(uint256 newRate);
    event TierFeesUpdated(uint256 t1, uint256 t2, uint256 t3, uint256 t4);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PausedStateChanged(bool isPaused);

    modifier onlyOwner() {
        require(msg.sender == owner, "OpenCatzVault: caller is not owner");
        _;
    }

    modifier nonReentrant() {
        require(_unlocked == 1, "OpenCatzVault: reentrancy locked");
        _unlocked = 0;
        _;
        _unlocked = 1;
    }

    modifier whenNotPaused() {
        require(!paused, "OpenCatzVault: vault paused");
        _;
    }

    constructor(address _nftAddress, address _tokenAddress) {
        require(_nftAddress != address(0), "OpenCatzVault: zero NFT address");
        require(_tokenAddress != address(0), "OpenCatzVault: zero Token address");
        
        owner = msg.sender;
        catzNFT = IOpenCatzNFT(_nftAddress);
        catzToken = IERC20Minimal(_tokenAddress);
        
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // --- Core Vault Swap Operations ---

    /**
     * @notice Deposit an OpenCatz NFT into the vault in exchange for $CATZ tokens
     * @param tokenId The ID of the OpenCatz NFT being deposited
     */
    function depositNFT(uint256 tokenId) external nonReentrant whenNotPaused {
        require(catzNFT.ownerOf(tokenId) == msg.sender, "OpenCatzVault: caller does not own NFT");
        require(catzToken.balanceOf(address(this)) >= tokensPerNFT, "OpenCatzVault: insufficient token reserves");

        // Transfer NFT from user to Vault
        catzNFT.transferFrom(msg.sender, address(this), tokenId);

        // Add to inventory
        _inventoryTokens.push(tokenId);
        _inventoryIndex[tokenId] = _inventoryTokens.length;

        // Transfer $CATZ to user
        bool success = catzToken.transfer(msg.sender, tokensPerNFT);
        require(success, "OpenCatzVault: token transfer failed");

        emit NFTDeposited(msg.sender, tokenId, tokensPerNFT);
    }

    /**
     * @notice Redeem an OpenCatz NFT from the vault by paying $CATZ tokens
     * @param tokenId The ID of the NFT to withdraw from the vault inventory
     */
    function redeemNFT(uint256 tokenId) external nonReentrant whenNotPaused {
        require(isNFTInVault(tokenId), "OpenCatzVault: NFT not available in inventory");

        // Pull tokens from user into Vault
        bool success = catzToken.transferFrom(msg.sender, address(this), tokensPerNFT);
        require(success, "OpenCatzVault: token transferFrom failed");

        // Remove from inventory
        _removeFromInventory(tokenId);

        // Transfer NFT to user
        catzNFT.transferFrom(address(this), msg.sender, tokenId);

        emit NFTRedeemed(msg.sender, tokenId, tokensPerNFT);
    }

    /**
     * @notice Activate or upgrade the Payroll Tier of an OpenCatz NFT
     * @dev 50% of the $CATZ fee is burned directly to DEAD_ADDRESS, 50% stays in Reward Pot
     * @param tokenId The NFT being activated
     * @param targetTier The desired tier (1, 2, 3, or 4=9-Lives)
     */
    function activateTier(uint256 tokenId, uint8 targetTier) external nonReentrant whenNotPaused {
        require(catzNFT.ownerOf(tokenId) == msg.sender, "OpenCatzVault: caller is not NFT owner");
        require(targetTier >= 1 && targetTier <= 4, "OpenCatzVault: invalid tier level (1-4)");
        require(targetTier > nftTier[tokenId], "OpenCatzVault: must upgrade to higher tier");

        uint256 fee = getTierFee(targetTier);
        
        // Pull full fee from user into Vault
        bool success = catzToken.transferFrom(msg.sender, address(this), fee);
        require(success, "OpenCatzVault: fee transfer failed");

        // 50% Burn to Dead Address
        uint256 burnAmount = fee / 2;
        uint256 rewardShare = fee - burnAmount;

        bool burnSuccess = catzToken.transfer(DEAD_ADDRESS, burnAmount);
        require(burnSuccess, "OpenCatzVault: burn transfer failed");

        totalBurnedTokens += burnAmount;
        totalRewardPot += rewardShare;
        nftTier[tokenId] = targetTier;

        emit TierActivated(msg.sender, tokenId, targetTier, fee, burnAmount);
    }

    // --- Inventory Management Helpers ---

    function _removeFromInventory(uint256 tokenId) internal {
        uint256 indexPlusOne = _inventoryIndex[tokenId];
        require(indexPlusOne > 0, "OpenCatzVault: not in inventory");

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _inventoryTokens.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = _inventoryTokens[lastIndex];
            _inventoryTokens[index] = lastTokenId;
            _inventoryIndex[lastTokenId] = index + 1;
        }

        _inventoryTokens.pop();
        delete _inventoryIndex[tokenId];
    }

    // --- View Functions ---

    function isNFTInVault(uint256 tokenId) public view returns (bool) {
        return _inventoryIndex[tokenId] > 0;
    }

    function getVaultInventory() external view returns (uint256[] memory) {
        return _inventoryTokens;
    }

    function getInventoryCount() external view returns (uint256) {
        return _inventoryTokens.length;
    }

    function getTierFee(uint8 tier) public view returns (uint256) {
        if (tier == 1) return tier1Fee;
        if (tier == 2) return tier2Fee;
        if (tier == 3) return tier3Fee;
        if (tier == 4) return tier4Fee;
        revert("OpenCatzVault: invalid tier");
    }

    function totalBurned() external view returns (uint256) {
        return totalBurnedTokens;
    }

    // --- Owner & Emergency Configuration ---

    function setTokensPerNFT(uint256 newRate) external onlyOwner {
        require(newRate > 0, "OpenCatzVault: rate must be positive");
        tokensPerNFT = newRate;
        emit RateUpdated(newRate);
    }

    function setTierFees(uint256 t1, uint256 t2, uint256 t3, uint256 t4) external onlyOwner {
        tier1Fee = t1;
        tier2Fee = t2;
        tier3Fee = t3;
        tier4Fee = t4;
        emit TierFeesUpdated(t1, t2, t3, t4);
    }

    function setPaused(bool isPaused) external onlyOwner {
        paused = isPaused;
        emit PausedStateChanged(isPaused);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OpenCatzVault: zero new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
