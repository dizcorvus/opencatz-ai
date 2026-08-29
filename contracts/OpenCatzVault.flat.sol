// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * ==============================================================================
 * OPENCATZ VAULT - FLATTENED SINGLE-FILE CONTRACT (FOR 1-CLICK VERIFICATION)
 * Compiler: v0.8.24+commit.e11b9ed9 | Optimizer: Enabled (200 runs) | EVM: cancun
 * Network: Robinhood Chain (Chain ID: 4663)
 * Protocol Swap Fee: 0.0004444 ETH (4,444 Collection Meme Lore) -> Dev Treasury
 * ==============================================================================
 */

interface IOpenCatzNFTMinimal {
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC20Minimal {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title OpenCatzVault
 * @notice Central Liquidity Peg Vault for OpenCatz Ecosystem on Robinhood Chain (Chain ID: 4663)
 * @dev Holds 50% $CATZ token reserves from letscash.fun and enables trustless NFT ◄──► $CATZ swaps
 */
contract OpenCatzVault {
    address public owner;
    address public treasury;
    IOpenCatzNFTMinimal public immutable catzNFT;
    IERC20Minimal public catzToken;
    bool public tokenInitialized = false;

    // Fixed Swap Rate: 1 Catz NFT = 100,000 $CATZ (18 decimals)
    uint256 public tokensPerNFT = 100_000 * 1e18;
    
    // Protocol Swap Fee: 0.0004444 ETH (in wei)
    uint256 public swapFee = 444400000000000;
    bool public paused = false;

    // Vault NFT Inventory
    uint256[] private _inventoryTokens;
    mapping(uint256 => uint256) private _inventoryIndex; // tokenId -> array index + 1

    // Reentrancy guard
    uint8 private _unlocked = 1;

    // Events
    event NFTDeposited(address indexed user, uint256 indexed tokenId, uint256 tokensPaid, uint256 protocolFee);
    event NFTRedeemed(address indexed user, uint256 indexed tokenId, uint256 tokensReceived, uint256 protocolFee);
    event TokenAddressBound(address indexed tokenAddress);
    event RateUpdated(uint256 newRate);
    event SwapFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address indexed newTreasury);
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

    modifier onlyTokenReady() {
        require(tokenInitialized && address(catzToken) != address(0), "OpenCatzVault: token not bound yet");
        _;
    }

    /**
     * @param _nftAddress The OpenCatz NFT contract address (mandatory)
     * @param _tokenAddress The $CATZ token address (optional at deploy, pass address(0) to set later)
     * @param _treasury The Dev Treasury wallet address to receive 0.0004444 ETH fees
     */
    constructor(address _nftAddress, address _tokenAddress, address _treasury) {
        require(_nftAddress != address(0), "OpenCatzVault: zero NFT address");
        
        owner = msg.sender;
        treasury = _treasury != address(0) ? _treasury : msg.sender;
        catzNFT = IOpenCatzNFTMinimal(_nftAddress);
        
        if (_tokenAddress != address(0)) {
            catzToken = IERC20Minimal(_tokenAddress);
            tokenInitialized = true;
            emit TokenAddressBound(_tokenAddress);
        }
        
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Bind the $CATZ token contract address (One-Time Permanent Lock)
     * @param _tokenAddress The newly deployed $CATZ token address from letscash.fun
     */
    function setTokenAddress(address _tokenAddress) external onlyOwner {
        require(!tokenInitialized, "OpenCatzVault: token already permanently bound");
        require(_tokenAddress != address(0), "OpenCatzVault: zero token address");

        catzToken = IERC20Minimal(_tokenAddress);
        tokenInitialized = true;

        emit TokenAddressBound(_tokenAddress);
    }

    // --- Core Vault Swap Operations ---

    /**
     * @notice Deposit an OpenCatz NFT into the vault in exchange for $CATZ tokens
     * @param tokenId The ID of the OpenCatz NFT being deposited
     */
    function depositNFT(uint256 tokenId) external payable nonReentrant whenNotPaused onlyTokenReady {
        require(msg.value >= swapFee, "OpenCatzVault: insufficient protocol fee (0.0004444 ETH)");
        require(catzNFT.ownerOf(tokenId) == msg.sender, "OpenCatzVault: caller does not own NFT");
        require(catzToken.balanceOf(address(this)) >= tokensPerNFT, "OpenCatzVault: insufficient token reserves");

        // Forward protocol fee to treasury
        if (msg.value > 0) {
            (bool feeSuccess, ) = payable(treasury).call{value: msg.value}("");
            require(feeSuccess, "OpenCatzVault: treasury fee transfer failed");
        }

        // Transfer NFT from user to Vault
        catzNFT.transferFrom(msg.sender, address(this), tokenId);

        // Add to inventory
        _inventoryTokens.push(tokenId);
        _inventoryIndex[tokenId] = _inventoryTokens.length;

        // Transfer $CATZ to user
        bool success = catzToken.transfer(msg.sender, tokensPerNFT);
        require(success, "OpenCatzVault: token transfer failed");

        emit NFTDeposited(msg.sender, tokenId, tokensPerNFT, msg.value);
    }

    /**
     * @notice Redeem an OpenCatz NFT from the vault by paying $CATZ tokens
     * @param tokenId The ID of the NFT to withdraw from the vault inventory
     */
    function redeemNFT(uint256 tokenId) external payable nonReentrant whenNotPaused onlyTokenReady {
        require(msg.value >= swapFee, "OpenCatzVault: insufficient protocol fee (0.0004444 ETH)");
        require(isNFTInVault(tokenId), "OpenCatzVault: NFT not available in inventory");

        // Forward protocol fee to treasury
        if (msg.value > 0) {
            (bool feeSuccess, ) = payable(treasury).call{value: msg.value}("");
            require(feeSuccess, "OpenCatzVault: treasury fee transfer failed");
        }

        // Pull tokens from user into Vault
        bool success = catzToken.transferFrom(msg.sender, address(this), tokensPerNFT);
        require(success, "OpenCatzVault: token transferFrom failed");

        // Remove from inventory
        _removeFromInventory(tokenId);

        // Transfer NFT to user
        catzNFT.transferFrom(address(this), msg.sender, tokenId);

        emit NFTRedeemed(msg.sender, tokenId, tokensPerNFT, msg.value);
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

    // --- Owner & Emergency Configuration ---

    function setTokensPerNFT(uint256 newRate) external onlyOwner {
        require(newRate > 0, "OpenCatzVault: rate must be positive");
        tokensPerNFT = newRate;
        emit RateUpdated(newRate);
    }

    function setSwapFee(uint256 newFee) external onlyOwner {
        swapFee = newFee;
        emit SwapFeeUpdated(newFee);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "OpenCatzVault: zero treasury address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
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
