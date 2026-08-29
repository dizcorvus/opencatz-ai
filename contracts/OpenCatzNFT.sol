// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title OpenCatzNFT
 * @notice Official OpenCatz NFT Collection on Robinhood Chain (Chain ID: 4663)
 * @dev Implements ERC-721 with EIP-2981 standard 5% Creator Royalties for OpenSea.
 */
contract OpenCatzNFT {
    string public name;
    string public symbol;
    string private _baseTokenURI;
    
    address public owner;
    address public royaltyReceiver;
    uint96 public royaltyFeeBps = 500; // 500 bps = 5% Creator Royalty
    
    uint256 public constant MAX_SUPPLY = 4444;
    uint256 public totalSupply;
    uint256 public mintPrice = 0; // Free mint or customizable
    bool public mintActive = true;

    // Token tracking
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RoyaltyReceiverUpdated(address indexed newReceiver, uint96 newBps);

    modifier onlyOwner() {
        require(msg.sender == owner, "OpenCatzNFT: caller is not owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory baseURI_,
        address _royaltyReceiver
    ) {
        name = _name;
        symbol = _symbol;
        _baseTokenURI = baseURI_;
        owner = msg.sender;
        royaltyReceiver = _royaltyReceiver != address(0) ? _royaltyReceiver : msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // --- ERC-721 Standard Functions ---

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "ERC721: address zero is not a valid owner");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "ERC721: invalid token ID");
        return tokenOwner;
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "ERC721: approval to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "ERC721: approve caller is not token owner or approved for all"
        );

        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: invalid token ID");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        transferFrom(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        // Clear approvals
        delete _tokenApprovals[tokenId];

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    // --- Minting Functions ---

    function mint(address to) external payable returns (uint256) {
        require(mintActive, "OpenCatzNFT: Minting paused");
        require(totalSupply < MAX_SUPPLY, "OpenCatzNFT: Max supply reached");
        require(msg.value >= mintPrice, "OpenCatzNFT: Insufficient ETH sent");

        uint256 tokenId = totalSupply + 1;
        totalSupply += 1;

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function batchMint(address to, uint256 quantity) external payable {
        require(mintActive, "OpenCatzNFT: Minting paused");
        require(totalSupply + quantity <= MAX_SUPPLY, "OpenCatzNFT: Exceeds max supply");
        require(msg.value >= mintPrice * quantity, "OpenCatzNFT: Insufficient ETH sent");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply + 1;
            totalSupply += 1;
            _balances[to] += 1;
            _owners[tokenId] = to;
            emit Transfer(address(0), to, tokenId);
        }
    }

    // --- EIP-2981 Royalty Standard (5% default for OpenSea) ---

    function royaltyInfo(uint256, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        receiver = royaltyReceiver;
        royaltyAmount = (salePrice * royaltyFeeBps) / 10000;
    }

    function setRoyaltyInfo(address _receiver, uint96 _bps) external onlyOwner {
        require(_receiver != address(0), "OpenCatzNFT: Zero address receiver");
        require(_bps <= 1000, "OpenCatzNFT: Max royalty is 10%");
        royaltyReceiver = _receiver;
        royaltyFeeBps = _bps;
        emit RoyaltyReceiverUpdated(_receiver, _bps);
    }

    // --- Admin & Metadata ---

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "ERC721: URI query for nonexistent token");
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId), ".json"));
    }

    function setBaseURI(string memory newURI) external onlyOwner {
        _baseTokenURI = newURI;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setMintActive(bool active) external onlyOwner {
        mintActive = active;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "OpenCatzNFT: No funds to withdraw");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "OpenCatzNFT: Withdraw failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OpenCatzNFT: New owner is address zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Interface support (ERC165)
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f || // ERC721Metadata
            interfaceId == 0x2a55205a || // EIP2981 (Royalty)
            interfaceId == 0x01ffc9a7;   // ERC165
    }
}
