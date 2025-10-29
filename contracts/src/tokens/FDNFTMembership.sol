// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title FDNFTMembership
 * @notice Fractional Dynamic NFT for DAO memberships
 * @dev NFTs represent membership with voting power and revenue share
 */
contract FDNFTMembership is ERC721Enumerable {
    struct Membership {
        uint256 votingPower;
        uint256 sharePercentage;
        uint256 lockupEnd;
        uint256 joinedAt;
        bool isActive;
    }

    address public dao;
    string private _baseTokenURI;
    bool public isInitialized;

    uint256 private _nextTokenId;
    mapping(uint256 => Membership) public memberships;
    mapping(address => uint256[]) public memberTokens;

    event MembershipMinted(address indexed to, uint256 indexed tokenId, uint256 votingPower);
    event VotingPowerUpdated(uint256 indexed tokenId, uint256 oldPower, uint256 newPower);
    event MembershipDeactivated(uint256 indexed tokenId);

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can call");
        _;
    }

    modifier onlyInitialized() {
        require(isInitialized, "Not initialized");
        _;
    }

    constructor() ERC721("", "") {}

    function initialize(
        string memory name,
        string memory symbol,
        address _dao
    ) external {
        require(!isInitialized, "Already initialized");
        require(_dao != address(0), "Invalid DAO");

        dao = _dao;
        isInitialized = true;

        // Note: Can't reinitialize ERC721 name/symbol in proxy pattern
        // Would need custom implementation or accept limitation
    }

    function mint(address to, uint256 votingPower) external onlyInitialized onlyDAO returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(votingPower > 0, "Voting power must be > 0");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        memberships[tokenId] = Membership({
            votingPower: votingPower,
            sharePercentage: 0, // To be calculated
            lockupEnd: 0,
            joinedAt: block.timestamp,
            isActive: true
        });

        memberTokens[to].push(tokenId);

        emit MembershipMinted(to, tokenId, votingPower);

        return tokenId;
    }

    function updateVotingPower(uint256 tokenId, uint256 newPower) external onlyDAO {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(newPower > 0, "Voting power must be > 0");

        uint256 oldPower = memberships[tokenId].votingPower;
        memberships[tokenId].votingPower = newPower;

        emit VotingPowerUpdated(tokenId, oldPower, newPower);
    }

    function deactivateMembership(uint256 tokenId) external onlyDAO {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        memberships[tokenId].isActive = false;
        emit MembershipDeactivated(tokenId);
    }

    function getVotingPower(address member) external view returns (uint256) {
        uint256 totalPower = 0;
        uint256[] memory tokens = memberTokens[member];

        for (uint256 i = 0; i < tokens.length; i++) {
            if (_ownerOf(tokens[i]) == member && memberships[tokens[i]].isActive) {
                totalPower += memberships[tokens[i]].votingPower;
            }
        }

        return totalPower;
    }

    function getMembershipInfo(uint256 tokenId)
        external
        view
        returns (Membership memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return memberships[tokenId];
    }

    function getMemberTokens(address member) external view returns (uint256[] memory) {
        return memberTokens[member];
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyDAO {
        _baseTokenURI = baseURI;
    }
}
