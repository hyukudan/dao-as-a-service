export const DAOFactoryABI = [
  {
    type: "event",
    name: "DAOCreated",
    inputs: [
      { name: "daoAddress", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "daoInfo",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "creator", type: "address" },
      { name: "governance", type: "address" },
      { name: "treasury", type: "address" },
      { name: "membership", type: "address" },
      { name: "createdAt", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
  },
] as const;

export const GovernanceModuleABI = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "startBlock", type: "uint256", indexed: false },
      { name: "endBlock", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "voter", type: "address", indexed: true },
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "support", type: "uint8", indexed: false },
      { name: "votes", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ name: "proposalId", type: "uint256", indexed: true }],
  },
  {
    type: "event",
    name: "ProposalCanceled",
    inputs: [{ name: "proposalId", type: "uint256", indexed: true }],
  },
] as const;

export const DAOCoreABI = [
  {
    type: "event",
    name: "MemberAdded",
    inputs: [{ name: "member", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "MemberRemoved",
    inputs: [{ name: "member", type: "address", indexed: true }],
  },
] as const;

export const TreasuryModuleABI = [
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawal",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
