const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAOFactory", function () {
  let daoFactory;
  let daoImpl;
  let governanceImpl;
  let treasuryImpl;
  let membershipImpl;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy implementation contracts
    const DAOCore = await ethers.getContractFactory("DAOCore");
    daoImpl = await DAOCore.deploy();

    const GovernanceModule = await ethers.getContractFactory("GovernanceModule");
    governanceImpl = await GovernanceModule.deploy();

    const TreasuryModule = await ethers.getContractFactory("TreasuryModule");
    treasuryImpl = await TreasuryModule.deploy();

    const FDNFTMembership = await ethers.getContractFactory("FDNFTMembership");
    membershipImpl = await FDNFTMembership.deploy();

    // Deploy factory
    const DAOFactory = await ethers.getContractFactory("DAOFactory");
    daoFactory = await DAOFactory.deploy(
      await daoImpl.getAddress(),
      await governanceImpl.getAddress(),
      await treasuryImpl.getAddress(),
      await membershipImpl.getAddress()
    );
  });

  describe("Deployment", function () {
    it("Should set the correct implementation addresses", async function () {
      expect(await daoFactory.daoImplementation()).to.equal(await daoImpl.getAddress());
      expect(await daoFactory.governanceImplementation()).to.equal(await governanceImpl.getAddress());
      expect(await daoFactory.treasuryImplementation()).to.equal(await treasuryImpl.getAddress());
      expect(await daoFactory.membershipImplementation()).to.equal(await membershipImpl.getAddress());
    });

    it("Should set the deployer as owner", async function () {
      expect(await daoFactory.owner()).to.equal(owner.address);
    });
  });

  describe("DAO Creation", function () {
    it("Should create a new DAO successfully", async function () {
      const config = {
        name: "Test DAO",
        symbol: "TEST",
        initialMembers: [user1.address],
        votingPowers: [100],
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      const tx = await daoFactory.createDAO(config);
      const receipt = await tx.wait();

      // Check event was emitted
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DAOCreated"
      );
      expect(event).to.not.be.undefined;

      // Check DAO was registered
      expect(await daoFactory.getDAOCount()).to.equal(1);
    });

    it("Should fail with empty name", async function () {
      const config = {
        name: "",
        symbol: "TEST",
        initialMembers: [user1.address],
        votingPowers: [100],
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      await expect(daoFactory.createDAO(config)).to.be.revertedWith(
        "Name cannot be empty"
      );
    });

    it("Should fail with no initial members", async function () {
      const config = {
        name: "Test DAO",
        symbol: "TEST",
        initialMembers: [],
        votingPowers: [],
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      await expect(daoFactory.createDAO(config)).to.be.revertedWith(
        "Must have at least one member"
      );
    });

    it("Should fail with mismatched members and powers", async function () {
      const config = {
        name: "Test DAO",
        symbol: "TEST",
        initialMembers: [user1.address, user2.address],
        votingPowers: [100], // Only one power for two members
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      await expect(daoFactory.createDAO(config)).to.be.revertedWith(
        "Members and powers length mismatch"
      );
    });

    it("Should create multiple DAOs", async function () {
      const config1 = {
        name: "DAO 1",
        symbol: "DAO1",
        initialMembers: [user1.address],
        votingPowers: [100],
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      const config2 = {
        name: "DAO 2",
        symbol: "DAO2",
        initialMembers: [user2.address],
        votingPowers: [200],
        votingDelay: 2,
        votingPeriod: 200,
        proposalThreshold: 2,
        quorumPercentage: 60,
      };

      await daoFactory.createDAO(config1);
      await daoFactory.createDAO(config2);

      expect(await daoFactory.getDAOCount()).to.equal(2);
    });

    it("Should register DAO info correctly", async function () {
      const config = {
        name: "Test DAO",
        symbol: "TEST",
        initialMembers: [user1.address],
        votingPowers: [100],
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      const tx = await daoFactory.createDAO(config);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DAOCreated"
      );
      const daoAddress = event.args[0];

      const info = await daoFactory.daoInfo(daoAddress);
      expect(info.name).to.equal("Test DAO");
      expect(info.creator).to.equal(owner.address);
      expect(info.isActive).to.be.true;
    });
  });

  describe("DAO Queries", function () {
    beforeEach(async function () {
      // Create a few DAOs for testing
      for (let i = 0; i < 5; i++) {
        const config = {
          name: `DAO ${i}`,
          symbol: `DAO${i}`,
          initialMembers: [user1.address],
          votingPowers: [100],
          votingDelay: 1,
          votingPeriod: 100,
          proposalThreshold: 1,
          quorumPercentage: 50,
        };
        await daoFactory.createDAO(config);
      }
    });

    it("Should return correct DAO count", async function () {
      expect(await daoFactory.getDAOCount()).to.equal(5);
    });

    it("Should return paginated DAOs", async function () {
      const result = await daoFactory.getDAOs(0, 3);
      expect(result.daos.length).to.equal(3);
      expect(result.infos.length).to.equal(3);
    });

    it("Should handle offset correctly", async function () {
      const result = await daoFactory.getDAOs(2, 2);
      expect(result.daos.length).to.equal(2);
    });

    it("Should get DAOs by creator", async function () {
      const daos = await daoFactory.getDAOsByCreator(owner.address);
      expect(daos.length).to.equal(5);
    });

    it("Should return empty array for creator with no DAOs", async function () {
      const daos = await daoFactory.getDAOsByCreator(user2.address);
      expect(daos.length).to.equal(0);
    });
  });

  describe("Implementation Upgrades", function () {
    it("Should allow owner to upgrade DAO implementation", async function () {
      const NewDAOCore = await ethers.getContractFactory("DAOCore");
      const newImpl = await NewDAOCore.deploy();

      await daoFactory.upgradeDAOImplementation(await newImpl.getAddress());
      expect(await daoFactory.daoImplementation()).to.equal(await newImpl.getAddress());
    });

    it("Should prevent non-owner from upgrading", async function () {
      const NewDAOCore = await ethers.getContractFactory("DAOCore");
      const newImpl = await NewDAOCore.deploy();

      await expect(
        daoFactory.connect(user1).upgradeDAOImplementation(await newImpl.getAddress())
      ).to.be.reverted;
    });

    it("Should emit event on upgrade", async function () {
      const NewDAOCore = await ethers.getContractFactory("DAOCore");
      const newImpl = await NewDAOCore.deploy();

      await expect(daoFactory.upgradeDAOImplementation(await newImpl.getAddress()))
        .to.emit(daoFactory, "ImplementationUpgraded")
        .withArgs("DAO", await daoImpl.getAddress(), await newImpl.getAddress());
    });
  });

  describe("DAO Deactivation", function () {
    let daoAddress;

    beforeEach(async function () {
      const config = {
        name: "Test DAO",
        symbol: "TEST",
        initialMembers: [user1.address],
        votingPowers: [100],
        votingDelay: 1,
        votingPeriod: 100,
        proposalThreshold: 1,
        quorumPercentage: 50,
      };

      const tx = await daoFactory.createDAO(config);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "DAOCreated"
      );
      daoAddress = event.args[0];
    });

    it("Should allow owner to deactivate DAO", async function () {
      await daoFactory.deactivateDAO(daoAddress);
      const info = await daoFactory.daoInfo(daoAddress);
      expect(info.isActive).to.be.false;
    });

    it("Should prevent non-owner from deactivating", async function () {
      await expect(
        daoFactory.connect(user1).deactivateDAO(daoAddress)
      ).to.be.reverted;
    });

    it("Should emit event on deactivation", async function () {
      await expect(daoFactory.deactivateDAO(daoAddress))
        .to.emit(daoFactory, "DAODeactivated")
        .withArgs(daoAddress);
    });
  });
});
