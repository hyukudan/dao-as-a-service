// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./DAOCore.sol";
import "./governance/GovernanceModule.sol";
import "./treasury/TreasuryModule.sol";
import "./tokens/FDNFTMembership.sol";

/**
 * @title DAOFactory
 * @notice Factory contract for deploying new DAOs using minimal proxy pattern
 * @dev Uses EIP-1167 minimal proxies for gas-efficient deployments
 */
contract DAOFactory is Ownable {
    using Clones for address;

    // Implementation contracts
    address public daoImplementation;
    address public governanceImplementation;
    address public treasuryImplementation;
    address public membershipImplementation;

    // Registry of all created DAOs
    address[] public allDAOs;
    mapping(address => bool) public isDAO;
    mapping(address => DAOInfo) public daoInfo;

    struct DAOInfo {
        string name;
        address creator;
        address governance;
        address treasury;
        address membership;
        uint256 createdAt;
        bool isActive;
    }

    struct DAOConfig {
        string name;
        string symbol;
        address[] initialMembers;
        uint256[] votingPowers;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumPercentage;
    }

    // Events
    event DAOCreated(
        address indexed daoAddress,
        address indexed creator,
        string name,
        uint256 timestamp
    );

    event ImplementationUpgraded(
        string indexed contractType,
        address oldImplementation,
        address newImplementation
    );

    event DAODeactivated(address indexed daoAddress);

    constructor(
        address _daoImpl,
        address _governanceImpl,
        address _treasuryImpl,
        address _membershipImpl
    ) Ownable(msg.sender) {
        require(_daoImpl != address(0), "Invalid DAO implementation");
        require(_governanceImpl != address(0), "Invalid governance implementation");
        require(_treasuryImpl != address(0), "Invalid treasury implementation");
        require(_membershipImpl != address(0), "Invalid membership implementation");

        daoImplementation = _daoImpl;
        governanceImplementation = _governanceImpl;
        treasuryImplementation = _treasuryImpl;
        membershipImplementation = _membershipImpl;
    }

    /**
     * @notice Create a new DAO with all its components
     * @param config Configuration parameters for the new DAO
     * @return daoAddress Address of the newly created DAO
     */
    function createDAO(DAOConfig calldata config) external returns (address daoAddress) {
        require(bytes(config.name).length > 0, "Name cannot be empty");
        require(config.initialMembers.length > 0, "Must have at least one member");
        require(
            config.initialMembers.length == config.votingPowers.length,
            "Members and powers length mismatch"
        );

        // Deploy minimal proxies
        address dao = daoImplementation.clone();
        address governance = governanceImplementation.clone();
        address payable treasury = payable(treasuryImplementation.clone());
        address membership = membershipImplementation.clone();

        // Initialize DAO Core
        DAOCore(dao).initialize(
            config.name,
            msg.sender,
            governance,
            treasury,
            membership
        );

        // Initialize Governance
        GovernanceModule(governance).initialize(
            dao,
            config.votingDelay,
            config.votingPeriod,
            config.proposalThreshold,
            config.quorumPercentage
        );

        // Initialize Treasury
        TreasuryModule(treasury).initialize(dao, governance);

        // Initialize Membership NFTs
        FDNFTMembership(membership).initialize(
            config.name,
            config.symbol,
            dao
        );

        // Mint membership NFTs to initial members
        for (uint256 i = 0; i < config.initialMembers.length; i++) {
            FDNFTMembership(membership).mint(
                config.initialMembers[i],
                config.votingPowers[i]
            );
        }

        // Register DAO
        allDAOs.push(dao);
        isDAO[dao] = true;
        daoInfo[dao] = DAOInfo({
            name: config.name,
            creator: msg.sender,
            governance: governance,
            treasury: treasury,
            membership: membership,
            createdAt: block.timestamp,
            isActive: true
        });

        emit DAOCreated(dao, msg.sender, config.name, block.timestamp);

        return dao;
    }

    /**
     * @notice Get total number of DAOs created
     */
    function getDAOCount() external view returns (uint256) {
        return allDAOs.length;
    }

    /**
     * @notice Get paginated list of DAOs
     */
    function getDAOs(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory daos, DAOInfo[] memory infos)
    {
        uint256 total = allDAOs.length;
        require(offset < total, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 size = end - offset;
        daos = new address[](size);
        infos = new DAOInfo[](size);

        for (uint256 i = 0; i < size; i++) {
            address daoAddr = allDAOs[offset + i];
            daos[i] = daoAddr;
            infos[i] = daoInfo[daoAddr];
        }
    }

    /**
     * @notice Get all DAOs created by a specific address
     */
    function getDAOsByCreator(address creator)
        external
        view
        returns (address[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < allDAOs.length; i++) {
            if (daoInfo[allDAOs[i]].creator == creator) {
                count++;
            }
        }

        address[] memory creatorDAOs = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allDAOs.length; i++) {
            if (daoInfo[allDAOs[i]].creator == creator) {
                creatorDAOs[index] = allDAOs[i];
                index++;
            }
        }

        return creatorDAOs;
    }

    /**
     * @notice Upgrade implementation contracts (only owner)
     */
    function upgradeDAOImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        address oldImpl = daoImplementation;
        daoImplementation = newImplementation;
        emit ImplementationUpgraded("DAO", oldImpl, newImplementation);
    }

    function upgradeGovernanceImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        address oldImpl = governanceImplementation;
        governanceImplementation = newImplementation;
        emit ImplementationUpgraded("Governance", oldImpl, newImplementation);
    }

    function upgradeTreasuryImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        address oldImpl = treasuryImplementation;
        treasuryImplementation = newImplementation;
        emit ImplementationUpgraded("Treasury", oldImpl, newImplementation);
    }

    function upgradeMembershipImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        address oldImpl = membershipImplementation;
        membershipImplementation = newImplementation;
        emit ImplementationUpgraded("Membership", oldImpl, newImplementation);
    }

    /**
     * @notice Deactivate a DAO (emergency only)
     */
    function deactivateDAO(address dao) external onlyOwner {
        require(isDAO[dao], "Not a registered DAO");
        daoInfo[dao].isActive = false;
        emit DAODeactivated(dao);
    }
}
