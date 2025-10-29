// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GovernanceModule
 * @notice Handles proposal creation, voting, and execution
 */
contract GovernanceModule is ReentrancyGuard {
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed,
        Canceled
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        mapping(address => Receipt) receipts;
    }

    struct Receipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
    }

    struct ProposalInfo {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
    }

    address public dao;
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;
    uint256 public quorumPercentage;

    uint256 private _proposalCount;
    mapping(uint256 => Proposal) private _proposals;
    uint256[] private _proposalIds;

    bool public isInitialized;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can call");
        _;
    }

    modifier onlyInitialized() {
        require(isInitialized, "Not initialized");
        _;
    }

    function initialize(
        address _dao,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    ) external {
        require(!isInitialized, "Already initialized");
        require(_dao != address(0), "Invalid DAO");
        require(_quorumPercentage <= 100, "Invalid quorum");

        dao = _dao;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumPercentage = _quorumPercentage;
        isInitialized = true;
    }

    function propose(
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external onlyInitialized returns (uint256) {
        require(targets.length == values.length, "Proposal mismatch");
        require(targets.length == calldatas.length, "Proposal mismatch");
        require(targets.length > 0, "Empty proposal");

        uint256 proposalId = ++_proposalCount;
        Proposal storage proposal = _proposals[proposalId];

        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startBlock = block.number + votingDelay;
        proposal.endBlock = block.number + votingDelay + votingPeriod;

        _proposalIds.push(proposalId);

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            proposal.startBlock,
            proposal.endBlock
        );

        return proposalId;
    }

    function vote(uint256 proposalId, uint8 support) external onlyInitialized {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        require(support <= uint8(VoteType.Abstain), "Invalid vote type");

        Proposal storage proposal = _proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];

        require(!receipt.hasVoted, "Already voted");

        // In a real implementation, get voting power from membership NFT
        uint256 votes = 1; // Placeholder

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        if (support == uint8(VoteType.Against)) {
            proposal.againstVotes += votes;
        } else if (support == uint8(VoteType.For)) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }

        emit VoteCast(msg.sender, proposalId, support, votes);
    }

    function execute(uint256 proposalId) external onlyInitialized nonReentrant {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");

        Proposal storage proposal = _proposals[proposalId];
        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "Transaction execution reverted");
        }

        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external onlyInitialized {
        Proposal storage proposal = _proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == dao,
            "Not authorized"
        );
        require(!proposal.executed, "Already executed");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        bool quorumReached = (totalVotes * 100) / 100 >= quorumPercentage; // Simplified

        if (quorumReached && proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    function getProposal(uint256 proposalId) external view returns (ProposalInfo memory) {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");

        return ProposalInfo({
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            executed: proposal.executed,
            canceled: proposal.canceled
        });
    }

    function getReceipt(uint256 proposalId, address voter)
        external
        view
        returns (Receipt memory)
    {
        return _proposals[proposalId].receipts[voter];
    }

    function proposalCount() external view returns (uint256) {
        return _proposalCount;
    }

    function getAllProposalIds() external view returns (uint256[] memory) {
        return _proposalIds;
    }
}
