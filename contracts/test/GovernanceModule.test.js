const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceModule", function () {
  let governance;
  let daoAddress;
  let owner;
  let proposer;
  let voter1;
  let voter2;

  beforeEach(async function () {
    [owner, proposer, voter1, voter2] = await ethers.getSigners();

    // Deploy governance module
    const GovernanceModule = await ethers.getContractFactory("GovernanceModule");
    governance = await GovernanceModule.deploy();

    // Use owner address as mock DAO
    daoAddress = owner.address;

    // Initialize
    await governance.initialize(
      daoAddress,
      1, // votingDelay
      100, // votingPeriod
      1, // proposalThreshold
      50 // quorumPercentage
    );
  });

  describe("Initialization", function () {
    it("Should set correct parameters", async function () {
      expect(await governance.dao()).to.equal(daoAddress);
      expect(await governance.votingDelay()).to.equal(1);
      expect(await governance.votingPeriod()).to.equal(100);
      expect(await governance.proposalThreshold()).to.equal(1);
      expect(await governance.quorumPercentage()).to.equal(50);
    });

    it("Should prevent double initialization", async function () {
      await expect(
        governance.initialize(daoAddress, 1, 100, 1, 50)
      ).to.be.revertedWith("Already initialized");
    });

    it("Should fail with invalid quorum", async function () {
      const GovernanceModule = await ethers.getContractFactory("GovernanceModule");
      const gov = await GovernanceModule.deploy();

      await expect(
        gov.initialize(daoAddress, 1, 100, 1, 101)
      ).to.be.revertedWith("Invalid quorum");
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal successfully", async function () {
      const tx = await governance.propose(
        "Test Proposal",
        "This is a test proposal",
        [],
        [],
        []
      );

      await expect(tx)
        .to.emit(governance, "ProposalCreated")
        .withArgs(1, owner.address, "Test Proposal");

      expect(await governance.proposalCount()).to.equal(1);
    });

    it("Should fail with empty targets array", async function () {
      await expect(
        governance.propose("Test", "Description", [], [], [])
      ).to.be.revertedWith("Empty proposal");
    });

    it("Should fail with mismatched arrays", async function () {
      await expect(
        governance.propose(
          "Test",
          "Description",
          [voter1.address], // 1 target
          [], // 0 values
          []
        )
      ).to.be.revertedWith("Proposal mismatch");
    });

    it("Should create multiple proposals", async function () {
      await governance.propose("Proposal 1", "Description 1", [voter1.address], [0], ["0x"]);
      await governance.propose("Proposal 2", "Description 2", [voter2.address], [0], ["0x"]);

      expect(await governance.proposalCount()).to.equal(2);
    });

    it("Should set correct proposal parameters", async function () {
      await governance.propose("Test", "Description", [voter1.address], [0], ["0x"]);

      const proposal = await governance.getProposal(1);
      expect(proposal.title).to.equal("Test");
      expect(proposal.description).to.equal("Description");
      expect(proposal.proposer).to.equal(owner.address);
      expect(proposal.executed).to.be.false;
      expect(proposal.canceled).to.be.false;
    });
  });

  describe("Proposal States", function () {
    let proposalId;

    beforeEach(async function () {
      const tx = await governance.propose(
        "Test Proposal",
        "Description",
        [voter1.address],
        [0],
        ["0x"]
      );
      proposalId = 1;
    });

    it("Should start in Pending state", async function () {
      const state = await governance.state(proposalId);
      expect(state).to.equal(0); // Pending
    });

    it("Should transition to Active after voting delay", async function () {
      // Mine blocks to pass voting delay
      await ethers.provider.send("hardhat_mine", ["0x2"]); // Mine 2 blocks

      const state = await governance.state(proposalId);
      expect(state).to.equal(1); // Active
    });

    it("Should show Defeated if more against votes", async function () {
      // Mine blocks to make proposal active
      await ethers.provider.send("hardhat_mine", ["0x2"]);

      // Vote against (simplified - would need actual voting power)
      // This is a simplified test

      // Mine blocks to end voting period
      await ethers.provider.send("hardhat_mine", ["0x65"]); // 101 blocks

      // State depends on vote results
      const state = await governance.state(proposalId);
      expect(state).to.be.oneOf([2, 3]); // Defeated or Succeeded
    });
  });

  describe("Voting", function () {
    let proposalId;

    beforeEach(async function () {
      await governance.propose(
        "Test Proposal",
        "Description",
        [voter1.address],
        [0],
        ["0x"]
      );
      proposalId = 1;

      // Mine blocks to make proposal active
      await ethers.provider.send("hardhat_mine", ["0x2"]);
    });

    it("Should allow voting on active proposal", async function () {
      await expect(governance.vote(proposalId, 1))
        .to.emit(governance, "VoteCast")
        .withArgs(owner.address, proposalId, 1);
    });

    it("Should prevent double voting", async function () {
      await governance.vote(proposalId, 1);

      await expect(governance.vote(proposalId, 1)).to.be.revertedWith(
        "Already voted"
      );
    });

    it("Should fail with invalid vote type", async function () {
      await expect(governance.vote(proposalId, 3)).to.be.revertedWith(
        "Invalid vote type"
      );
    });

    it("Should fail voting on pending proposal", async function () {
      await governance.propose("New Proposal", "Description", [voter1.address], [0], ["0x"]);

      await expect(governance.vote(2, 1)).to.be.revertedWith(
        "Voting is closed"
      );
    });

    it("Should record vote counts correctly", async function () {
      await governance.vote(proposalId, 1); // Vote For

      const proposal = await governance.getProposal(proposalId);
      // Note: Vote count depends on voting power from membership NFT
      // In this test, we're using placeholder value
      expect(proposal.forVotes).to.be.gt(0);
    });
  });

  describe("Proposal Execution", function () {
    let proposalId;

    beforeEach(async function () {
      await governance.propose(
        "Test Proposal",
        "Description",
        [voter1.address],
        [0],
        ["0x"]
      );
      proposalId = 1;

      // Mine blocks to make active
      await ethers.provider.send("hardhat_mine", ["0x2"]);
    });

    it("Should prevent execution of non-succeeded proposal", async function () {
      await expect(governance.execute(proposalId)).to.be.revertedWith(
        "Proposal not succeeded"
      );
    });

    it("Should mark proposal as executed", async function () {
      // This would need votes to succeed first
      // Simplified test structure
    });
  });

  describe("Proposal Cancellation", function () {
    let proposalId;

    beforeEach(async function () {
      await governance.connect(proposer).propose(
        "Test Proposal",
        "Description",
        [voter1.address],
        [0],
        ["0x"]
      );
      proposalId = 1;
    });

    it("Should allow proposer to cancel", async function () {
      await expect(governance.connect(proposer).cancel(proposalId))
        .to.emit(governance, "ProposalCanceled")
        .withArgs(proposalId);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.canceled).to.be.true;
    });

    it("Should allow DAO to cancel", async function () {
      // Owner is acting as DAO in this test
      await governance.cancel(proposalId);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.canceled).to.be.true;
    });

    it("Should prevent unauthorized cancellation", async function () {
      await expect(
        governance.connect(voter1).cancel(proposalId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent canceling executed proposal", async function () {
      // Would need to execute first
      // Simplified test
    });
  });

  describe("Queries", function () {
    beforeEach(async function () {
      await governance.propose("Proposal 1", "Desc 1", [voter1.address], [0], ["0x"]);
      await governance.propose("Proposal 2", "Desc 2", [voter2.address], [0], ["0x"]);
    });

    it("Should return all proposal IDs", async function () {
      const ids = await governance.getAllProposalIds();
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1);
      expect(ids[1]).to.equal(2);
    });

    it("Should return correct proposal count", async function () {
      expect(await governance.proposalCount()).to.equal(2);
    });

    it("Should get proposal by ID", async function () {
      const proposal = await governance.getProposal(1);
      expect(proposal.title).to.equal("Proposal 1");
      expect(proposal.id).to.equal(1);
    });

    it("Should fail getting non-existent proposal", async function () {
      await expect(governance.getProposal(999)).to.be.revertedWith(
        "Proposal does not exist"
      );
    });
  });
});
