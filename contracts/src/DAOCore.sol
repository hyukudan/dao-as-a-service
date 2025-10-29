// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DAOCore
 * @notice Core contract for DAO functionality
 * @dev Manages DAO configuration and integrations
 */
contract DAOCore is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

    string public name;
    address public creator;
    address public governance;
    address public treasury;
    address public membership;
    uint256 public createdAt;
    bool public isInitialized;

    mapping(address => bool) public isMember;
    address[] public members;

    event DAOInitialized(string name, address creator, uint256 timestamp);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event GovernanceUpdated(address oldGovernance, address newGovernance);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    modifier onlyInitialized() {
        require(isInitialized, "DAO not initialized");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance can call");
        _;
    }

    /**
     * @notice Initialize the DAO (called by factory)
     */
    function initialize(
        string memory _name,
        address _creator,
        address _governance,
        address _treasury,
        address _membership
    ) external {
        require(!isInitialized, "Already initialized");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_creator != address(0), "Invalid creator");
        require(_governance != address(0), "Invalid governance");
        require(_treasury != address(0), "Invalid treasury");
        require(_membership != address(0), "Invalid membership");

        name = _name;
        creator = _creator;
        governance = _governance;
        treasury = _treasury;
        membership = _membership;
        createdAt = block.timestamp;
        isInitialized = true;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, _creator);
        _grantRole(ADMIN_ROLE, _creator);
        _grantRole(MEMBER_ROLE, _creator);

        // Add creator as first member
        isMember[_creator] = true;
        members.push(_creator);

        emit DAOInitialized(_name, _creator, block.timestamp);
    }

    /**
     * @notice Add a new member
     */
    function addMember(address member) external onlyInitialized onlyGovernance {
        require(member != address(0), "Invalid member");
        require(!isMember[member], "Already a member");

        isMember[member] = true;
        members.push(member);
        _grantRole(MEMBER_ROLE, member);

        emit MemberAdded(member);
    }

    /**
     * @notice Remove a member
     */
    function removeMember(address member) external onlyInitialized onlyGovernance {
        require(isMember[member], "Not a member");
        require(member != creator, "Cannot remove creator");

        isMember[member] = false;
        _revokeRole(MEMBER_ROLE, member);

        // Remove from members array
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == member) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }

        emit MemberRemoved(member);
    }

    /**
     * @notice Update governance contract
     */
    function setGovernance(address newGovernance) external onlyRole(ADMIN_ROLE) {
        require(newGovernance != address(0), "Invalid governance");
        address oldGovernance = governance;
        governance = newGovernance;
        emit GovernanceUpdated(oldGovernance, newGovernance);
    }

    /**
     * @notice Update treasury contract
     */
    function setTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Get all members
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    /**
     * @notice Get member count
     */
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    /**
     * @notice Get DAO info
     */
    function getInfo()
        external
        view
        returns (
            string memory _name,
            address _creator,
            address _governance,
            address _treasury,
            address _membership,
            uint256 _createdAt,
            uint256 _memberCount
        )
    {
        return (name, creator, governance, treasury, membership, createdAt, members.length);
    }
}
