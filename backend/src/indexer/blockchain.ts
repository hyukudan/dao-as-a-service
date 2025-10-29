import { ethers } from "ethers";
import { DAOFactoryABI, GovernanceModuleABI, DAOCoreABI, TreasuryModuleABI } from "./contracts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class BlockchainIndexer {
  private provider: ethers.JsonRpcProvider;
  private factoryAddress: string;
  private lastProcessedBlock: number = 0;

  constructor(rpcUrl: string, factoryAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.factoryAddress = factoryAddress;
  }

  async start(fromBlock?: number) {
    console.log("🔍 Starting blockchain indexer...");

    // Get current block
    const currentBlock = await this.provider.getBlockNumber();
    this.lastProcessedBlock = fromBlock || currentBlock;

    console.log(`📦 Starting from block ${this.lastProcessedBlock}`);

    // Index historical events
    await this.indexHistoricalEvents(this.lastProcessedBlock, currentBlock);

    // Listen for new events
    this.listenForNewEvents();

    // Poll for new blocks every 3 seconds
    setInterval(() => this.pollNewBlocks(), 3000);
  }

  private async indexHistoricalEvents(fromBlock: number, toBlock: number) {
    console.log(`📜 Indexing historical events from block ${fromBlock} to ${toBlock}...`);

    const factory = new ethers.Contract(this.factoryAddress, DAOFactoryABI, this.provider);

    // Get all DAOCreated events
    const filter = factory.filters.DAOCreated();
    const events = await factory.queryFilter(filter, fromBlock, toBlock);

    console.log(`Found ${events.length} DAOCreated events`);

    for (const event of events) {
      await this.handleDAOCreated(event);
    }

    console.log("✅ Historical indexing complete");
  }

  private listenForNewEvents() {
    const factory = new ethers.Contract(this.factoryAddress, DAOFactoryABI, this.provider);

    // Listen for DAOCreated events
    factory.on("DAOCreated", async (daoAddress, creator, name, timestamp, event) => {
      console.log(`📢 New DAO created: ${name} at ${daoAddress}`);
      await this.handleDAOCreated(event);
    });
  }

  private async pollNewBlocks() {
    try {
      const currentBlock = await this.provider.getBlockNumber();

      if (currentBlock > this.lastProcessedBlock) {
        await this.indexHistoricalEvents(this.lastProcessedBlock + 1, currentBlock);
        this.lastProcessedBlock = currentBlock;
      }
    } catch (error) {
      console.error("Error polling blocks:", error);
    }
  }

  private async handleDAOCreated(event: any) {
    const { daoAddress, creator, name, timestamp } = event.args;
    const blockNumber = event.blockNumber;
    const txHash = event.transactionHash;

    console.log(`Processing DAO: ${name} (${daoAddress})`);

    try {
      // Get DAO info from contract
      const factory = new ethers.Contract(this.factoryAddress, DAOFactoryABI, this.provider);
      const daoInfo = await factory.daoInfo(daoAddress);

      // Store DAO in database
      const dao = await prisma.dao.upsert({
        where: { address: daoAddress },
        update: {},
        create: {
          address: daoAddress,
          name: name,
          creator: creator,
          createdAt: new Date(Number(timestamp) * 1000),
        },
      });

      // Create activity record
      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "DAOCreated",
          actor: creator,
          metadata: {
            txHash,
            blockNumber,
            governance: daoInfo.governance,
            treasury: daoInfo.treasury,
            membership: daoInfo.membership,
          },
        },
      });

      // Start listening to this DAO's events
      await this.listenToDAO(daoAddress, daoInfo);

      console.log(`✅ Indexed DAO: ${name}`);
    } catch (error) {
      console.error(`Error indexing DAO ${daoAddress}:`, error);
    }
  }

  private async listenToDAO(daoAddress: string, daoInfo: any) {
    // Listen to Governance events
    const governance = new ethers.Contract(
      daoInfo.governance,
      GovernanceModuleABI,
      this.provider
    );

    governance.on("ProposalCreated", async (proposalId, proposer, title, startBlock, endBlock, event) => {
      await this.handleProposalCreated(daoAddress, event);
    });

    governance.on("VoteCast", async (voter, proposalId, support, votes, event) => {
      await this.handleVoteCast(daoAddress, event);
    });

    // Listen to Treasury events
    const treasury = new ethers.Contract(
      daoInfo.treasury,
      TreasuryModuleABI,
      this.provider
    );

    treasury.on("Deposit", async (from, token, amount, event) => {
      await this.handleTreasuryDeposit(daoAddress, event);
    });

    treasury.on("Withdrawal", async (to, token, amount, event) => {
      await this.handleTreasuryWithdrawal(daoAddress, event);
    });

    // Listen to DAO Core events
    const daoCore = new ethers.Contract(daoAddress, DAOCoreABI, this.provider);

    daoCore.on("MemberAdded", async (member, event) => {
      await this.handleMemberAdded(daoAddress, event);
    });

    daoCore.on("MemberRemoved", async (member, event) => {
      await this.handleMemberRemoved(daoAddress, event);
    });
  }

  private async handleProposalCreated(daoAddress: string, event: any) {
    const { proposalId, proposer, title, startBlock, endBlock } = event.args;
    const txHash = event.transactionHash;

    try {
      const dao = await prisma.dao.findUnique({ where: { address: daoAddress } });
      if (!dao) return;

      await prisma.proposal.create({
        data: {
          proposalId: BigInt(proposalId.toString()),
          title,
          description: "", // Will be fetched separately
          proposer,
          state: "Pending",
          startBlock: BigInt(startBlock.toString()),
          endBlock: BigInt(endBlock.toString()),
          daoId: dao.id,
        },
      });

      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "ProposalCreated",
          actor: proposer,
          metadata: { txHash, proposalId: proposalId.toString(), title },
        },
      });

      console.log(`✅ Indexed proposal: ${title}`);
    } catch (error) {
      console.error("Error indexing proposal:", error);
    }
  }

  private async handleVoteCast(daoAddress: string, event: any) {
    const { voter, proposalId, support, votes } = event.args;
    const txHash = event.transactionHash;

    try {
      const dao = await prisma.dao.findUnique({ where: { address: daoAddress } });
      if (!dao) return;

      const proposal = await prisma.proposal.findUnique({
        where: { proposalId: BigInt(proposalId.toString()) },
      });
      if (!proposal) return;

      let member = await prisma.member.findUnique({
        where: { daoId_address: { daoId: dao.id, address: voter } },
      });

      if (!member) {
        member = await prisma.member.create({
          data: {
            daoId: dao.id,
            address: voter,
            votingPower: BigInt(votes.toString()),
            sharePercentage: 0,
          },
        });
      }

      await prisma.vote.create({
        data: {
          memberId: member.id,
          proposalId: proposal.id,
          support: Number(support),
          votingPower: BigInt(votes.toString()),
        },
      });

      // Update proposal vote counts
      if (support === 0) {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { againstVotes: proposal.againstVotes + BigInt(votes.toString()) },
        });
      } else if (support === 1) {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { forVotes: proposal.forVotes + BigInt(votes.toString()) },
        });
      } else {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: { abstainVotes: proposal.abstainVotes + BigInt(votes.toString()) },
        });
      }

      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "VoteCast",
          actor: voter,
          metadata: { txHash, proposalId: proposalId.toString(), support },
        },
      });

      console.log(`✅ Indexed vote from ${voter}`);
    } catch (error) {
      console.error("Error indexing vote:", error);
    }
  }

  private async handleTreasuryDeposit(daoAddress: string, event: any) {
    const { from, token, amount } = event.args;
    const txHash = event.transactionHash;

    try {
      const dao = await prisma.dao.findUnique({ where: { address: daoAddress } });
      if (!dao) return;

      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "TreasuryDeposit",
          actor: from,
          metadata: { txHash, token, amount: amount.toString() },
        },
      });

      console.log(`✅ Indexed treasury deposit: ${amount.toString()}`);
    } catch (error) {
      console.error("Error indexing deposit:", error);
    }
  }

  private async handleTreasuryWithdrawal(daoAddress: string, event: any) {
    const { to, token, amount } = event.args;
    const txHash = event.transactionHash;

    try {
      const dao = await prisma.dao.findUnique({ where: { address: daoAddress } });
      if (!dao) return;

      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "TreasuryWithdrawal",
          actor: to,
          metadata: { txHash, token, amount: amount.toString() },
        },
      });

      console.log(`✅ Indexed treasury withdrawal: ${amount.toString()}`);
    } catch (error) {
      console.error("Error indexing withdrawal:", error);
    }
  }

  private async handleMemberAdded(daoAddress: string, event: any) {
    const { member } = event.args;
    const txHash = event.transactionHash;

    try {
      const dao = await prisma.dao.findUnique({ where: { address: daoAddress } });
      if (!dao) return;

      await prisma.member.upsert({
        where: { daoId_address: { daoId: dao.id, address: member } },
        update: {},
        create: {
          daoId: dao.id,
          address: member,
          votingPower: BigInt(100),
          sharePercentage: 0,
        },
      });

      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "MemberAdded",
          actor: member,
          metadata: { txHash },
        },
      });

      console.log(`✅ Indexed new member: ${member}`);
    } catch (error) {
      console.error("Error indexing member:", error);
    }
  }

  private async handleMemberRemoved(daoAddress: string, event: any) {
    const { member } = event.args;
    const txHash = event.transactionHash;

    try {
      const dao = await prisma.dao.findUnique({ where: { address: daoAddress } });
      if (!dao) return;

      await prisma.activity.create({
        data: {
          daoId: dao.id,
          type: "MemberRemoved",
          actor: member,
          metadata: { txHash },
        },
      });

      console.log(`✅ Indexed member removal: ${member}`);
    } catch (error) {
      console.error("Error indexing member removal:", error);
    }
  }
}
