# Arquitectura DAO-as-a-Service

## Overview

DAO-as-a-Service es una plataforma completa para crear y gestionar DAOs sobre Attelyx Chain. La arquitectura sigue un diseño modular de 3 capas:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  (Next.js + Web3 Integration + UI Components)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API Calls / Web3 RPC
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Backend Layer                           │
│  (Indexer + REST API + GraphQL + Workers)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ RPC Calls / Event Listening
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Blockchain Layer                          │
│  (Attelyx Chain + Smart Contracts)                          │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: Smart Contracts (Blockchain)

### Core Contracts

#### 1. DAOFactory
**Responsabilidad**: Crear nuevas DAOs mediante proxy pattern

```solidity
contract DAOFactory {
    function createDAO(
        string memory name,
        address[] memory initialMembers,
        GovernanceConfig memory config
    ) external returns (address daoAddress);

    function upgradeDAOImplementation(address newImpl) external;

    event DAOCreated(address indexed dao, address indexed creator);
}
```

**Features**:
- Minimal proxy pattern (EIP-1167) para gas efficiency
- Registry de todas las DAOs creadas
- Upgrade mechanism con timelock

#### 2. DAOCore
**Responsabilidad**: Lógica central de cada DAO

```solidity
contract DAOCore {
    // State
    mapping(address => Member) public members;
    address public treasury;
    address public governance;
    bytes32 public configHash;

    // Member management
    function addMember(address member, uint256 votingPower) external;
    function removeMember(address member) external;
    function updateVotingPower(address member, uint256 newPower) external;

    // Integration points
    function setTreasury(address _treasury) external;
    function setGovernance(address _governance) external;
}
```

#### 3. FDNFTMembership
**Responsabilidad**: NFTs de membresía con gobernanza fraccional

```solidity
contract FDNFTMembership is ERC721 {
    struct Membership {
        uint256 votingPower;
        uint256 sharePercentage;
        uint256 lockupEnd;
        address[] delegates;
        bool isActive;
    }

    function mint(address to, MembershipConfig memory config) external;
    function delegate(uint256 tokenId, address delegatee) external;
    function updateVotingPower(uint256 tokenId) internal; // Dynamic updates
    function claimRevenue(uint256 tokenId) external;
}
```

**Features**:
- Voting power dinámico (time-weighted bonuses)
- Revenue distribution automática
- Delegation chains
- Lockup periods con incentivos

#### 4. GovernanceModule
**Responsabilidad**: Sistema de propuestas y votación

```solidity
contract GovernanceModule {
    enum VotingType { Simple, Weighted, Quadratic, Delegated }
    enum ProposalState { Pending, Active, Succeeded, Defeated, Executed }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes[] calls;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
    }

    function propose(
        string memory description,
        address[] memory targets,
        bytes[] memory calldatas
    ) external returns (uint256 proposalId);

    function vote(uint256 proposalId, uint8 support) external;
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;
}
```

**Voting Systems**:
- **Simple**: 1 token = 1 vote
- **Weighted**: stake-based power
- **Quadratic**: sqrt(tokens) para prevenir whales
- **Delegated**: liquid democracy

#### 5. TreasuryModule
**Responsabilidad**: Gestión de fondos

```solidity
contract TreasuryModule {
    function deposit() external payable;
    function withdraw(address token, uint256 amount, address to) external;
    function allocateBudget(bytes32 category, uint256 amount) external;
    function executePayment(uint256 proposalId) external;

    // DeFi integration
    function stake(address protocol, uint256 amount) external;
    function unstake(address protocol, uint256 amount) external;
    function harvest() external;
}
```

**Features**:
- Multi-sig requirement para withdrawals grandes
- Budget tracking por categoría
- DeFi yield farming integration
- Cross-chain transfers (via Attelyx bridges)

#### 6. CapabilityManager
**Responsabilidad**: Control de acceso granular usando Attelyx Capability Tokens

```solidity
contract CapabilityManager {
    struct Capability {
        bytes32 action;
        address[] holders;
        CapabilityPolicy policy;
    }

    function grantCapability(address user, bytes32 action) external;
    function revokeCapability(address user, bytes32 action) external;
    function checkCapability(address user, bytes32 action) external view returns (bool);
}
```

### Contract Deployment Flow

```
1. User creates DAO via Frontend
           ↓
2. Frontend calls DAOFactory.createDAO()
           ↓
3. DAOFactory deploys proxies:
   - DAOCore (proxy)
   - FDNFTMembership (proxy)
   - GovernanceModule (proxy)
   - TreasuryModule (proxy)
           ↓
4. DAOFactory initializes all contracts
           ↓
5. DAOFactory emits DAOCreated event
           ↓
6. Backend indexer picks up event
           ↓
7. DAO is now visible in frontend
```

## Layer 2: Backend (Indexer + API)

### Components

#### 1. Blockchain Indexer
**Responsabilidad**: Indexar eventos de blockchain en database relacional

```typescript
class BlockchainIndexer {
  async indexDAOCreated(event: DAOCreatedEvent) {
    // Save to database
    await db.dao.create({
      data: {
        address: event.daoAddress,
        creator: event.creator,
        blockNumber: event.blockNumber,
        timestamp: event.timestamp
      }
    });
  }

  async indexProposalCreated(event: ProposalCreatedEvent) { }
  async indexVoteCast(event: VoteCastEvent) { }
  async indexMemberAdded(event: MemberAddedEvent) { }
}
```

**Events Monitored**:
- DAOCreated
- ProposalCreated, ProposalExecuted, ProposalCanceled
- VoteCast
- MemberAdded, MemberRemoved
- TreasuryDeposit, TreasuryWithdrawal
- DelegateChanged

#### 2. REST/GraphQL API
**Responsabilidad**: Proveer datos indexados al frontend

```typescript
// tRPC Router
export const daoRouter = router({
  // List DAOs
  list: publicProcedure
    .input(z.object({ page: z.number(), limit: z.number() }))
    .query(async ({ input }) => {
      return await db.dao.findMany({
        skip: input.page * input.limit,
        take: input.limit,
        include: { members: true, proposals: true }
      });
    }),

  // Get DAO details
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await db.dao.findUnique({
        where: { address: input },
        include: {
          members: true,
          proposals: true,
          treasury: true,
          activity: true
        }
      });
    }),

  // Get proposals
  proposals: publicProcedure
    .input(z.object({ daoAddress: z.string() }))
    .query(async ({ input }) => {
      return await db.proposal.findMany({
        where: { daoAddress: input.daoAddress },
        orderBy: { createdAt: 'desc' }
      });
    })
});
```

#### 3. Background Workers
**Responsabilidad**: Tareas asíncronas

```typescript
// Proposal state updates
async function updateProposalStates() {
  const activeProposals = await db.proposal.findMany({
    where: { state: 'Active' }
  });

  for (const proposal of activeProposals) {
    const onChainState = await governance.proposalState(proposal.id);
    if (onChainState !== proposal.state) {
      await db.proposal.update({
        where: { id: proposal.id },
        data: { state: onChainState }
      });
    }
  }
}

// Revenue distribution calculations
async function calculateRevenueDistribution(daoAddress: string) {
  const members = await db.member.findMany({ where: { daoAddress } });
  const totalRevenue = await treasury.getBalance(daoAddress);

  for (const member of members) {
    const share = (member.sharePercentage / 100) * totalRevenue;
    await db.pendingClaim.create({
      data: { memberId: member.id, amount: share }
    });
  }
}
```

### Database Schema (Prisma)

```prisma
model DAO {
  id              String     @id @default(cuid())
  address         String     @unique
  name            String
  description     String?
  creator         String
  createdAt       DateTime   @default(now())

  members         Member[]
  proposals       Proposal[]
  treasury        Treasury?
  activity        Activity[]
}

model Member {
  id              String     @id @default(cuid())
  address         String
  votingPower     BigInt
  sharePercentage Decimal
  joinedAt        DateTime   @default(now())

  dao             DAO        @relation(fields: [daoId], references: [id])
  daoId           String

  votes           Vote[]
  delegations     Delegation[]
}

model Proposal {
  id              String         @id @default(cuid())
  proposalId      BigInt         @unique
  title           String
  description     String
  proposer        String
  state           ProposalState
  startBlock      BigInt
  endBlock        BigInt
  forVotes        BigInt
  againstVotes    BigInt
  abstainVotes    BigInt
  createdAt       DateTime       @default(now())

  dao             DAO            @relation(fields: [daoId], references: [id])
  daoId           String

  votes           Vote[]
}

model Vote {
  id          String   @id @default(cuid())
  support     Int
  votingPower BigInt
  reason      String?
  timestamp   DateTime @default(now())

  member      Member   @relation(fields: [memberId], references: [id])
  memberId    String

  proposal    Proposal @relation(fields: [proposalId], references: [id])
  proposalId  String
}

model Treasury {
  id              String   @id @default(cuid())
  balance         BigInt
  totalDeposits   BigInt
  totalWithdrawals BigInt

  dao             DAO      @relation(fields: [daoId], references: [id])
  daoId           String   @unique

  transactions    Transaction[]
}
```

## Layer 3: Frontend (Next.js)

### Architecture

```
frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (landing)/
│   │   │   └── page.tsx       # Landing page
│   │   ├── (app)/
│   │   │   ├── layout.tsx     # App layout with nav
│   │   │   ├── explore/       # Browse DAOs
│   │   │   ├── create/        # Create DAO wizard
│   │   │   └── dao/
│   │   │       └── [id]/      # DAO detail pages
│   │   │           ├── page.tsx
│   │   │           ├── proposals/
│   │   │           ├── members/
│   │   │           └── treasury/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── dao/               # DAO-specific components
│   │   ├── governance/        # Proposal & voting components
│   │   └── web3/              # Web3 connection components
│   ├── hooks/
│   │   ├── useDAO.ts
│   │   ├── useProposals.ts
│   │   ├── useVoting.ts
│   │   └── useContract.ts
│   ├── lib/
│   │   ├── contracts/         # Contract ABIs & addresses
│   │   ├── web3/              # Web3 setup (wagmi, viem)
│   │   └── api/               # tRPC client
│   └── store/                 # Zustand stores
```

### Key Features

#### 1. DAO Creation Wizard (Multi-Step Form)

```typescript
// app/create/page.tsx
export default function CreateDAOPage() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<DAOConfig>({});

  const steps = [
    { id: 1, name: 'Básico', component: BasicInfoStep },
    { id: 2, name: 'Gobernanza', component: GovernanceStep },
    { id: 3, name: 'Miembros', component: MembersStep },
    { id: 4, name: 'Revisión', component: ReviewStep }
  ];

  return (
    <WizardLayout steps={steps} currentStep={step}>
      {/* Render current step */}
    </WizardLayout>
  );
}
```

#### 2. Voting Interface

```typescript
// components/governance/VotingCard.tsx
export function VotingCard({ proposal }: { proposal: Proposal }) {
  const { vote, isLoading } = useVote();
  const { votingPower } = useVotingPower();

  return (
    <Card>
      <CardHeader>
        <h3>{proposal.title}</h3>
        <Badge>{proposal.state}</Badge>
      </CardHeader>
      <CardContent>
        <p>{proposal.description}</p>

        <VotingProgress
          forVotes={proposal.forVotes}
          againstVotes={proposal.againstVotes}
        />

        <div className="voting-buttons">
          <Button onClick={() => vote(proposal.id, VoteType.For)}>
            For ({votingPower} power)
          </Button>
          <Button onClick={() => vote(proposal.id, VoteType.Against)}>
            Against
          </Button>
          <Button onClick={() => vote(proposal.id, VoteType.Abstain)}>
            Abstain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. Web3 Integration

```typescript
// lib/web3/config.ts
import { createConfig, http } from 'wagmi';
import { attelyxChain } from './chains';

export const config = createConfig({
  chains: [attelyxChain],
  transports: {
    [attelyxChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL)
  }
});

// hooks/useDAO.ts
export function useDAO(address: string) {
  const { data, isLoading } = useReadContract({
    address,
    abi: DAOCoreABI,
    functionName: 'getDAOInfo'
  });

  return { dao: data, isLoading };
}

export function useCreateDAO() {
  const { writeContract } = useWriteContract();

  const createDAO = async (config: DAOConfig) => {
    return writeContract({
      address: DAO_FACTORY_ADDRESS,
      abi: DAOFactoryABI,
      functionName: 'createDAO',
      args: [config.name, config.members, config.governance]
    });
  };

  return { createDAO };
}
```

## Data Flow Examples

### Create DAO Flow
```
User fills form → Submit
  ↓
Frontend validates
  ↓
useCreateDAO() hook called
  ↓
Wallet popup (sign transaction)
  ↓
Transaction sent to Attelyx Chain
  ↓
DAOFactory.createDAO() executed
  ↓
DAOCreated event emitted
  ↓
Backend indexer catches event
  ↓
Database updated with new DAO
  ↓
Frontend shows success + redirects to DAO page
```

### Vote on Proposal Flow
```
User clicks "Vote For"
  ↓
useVote() hook called
  ↓
Check voting power (read contract)
  ↓
Submit vote (write contract)
  ↓
Wallet popup (sign transaction)
  ↓
GovernanceModule.vote() executed
  ↓
VoteCast event emitted
  ↓
Backend indexer updates vote counts
  ↓
Frontend updates in real-time (via WebSocket or polling)
```

## Security Considerations

### Smart Contracts
- OpenZeppelin contracts para base implementations
- ReentrancyGuard en todas las funciones payable
- Access control via OpenZeppelin AccessControl
- Timelock para cambios críticos (upgrades, parameter changes)
- Audit completo antes de mainnet

### Backend
- Rate limiting en API endpoints
- Input validation con Zod
- SQL injection prevention (Prisma ORM)
- Environment secrets en variables seguras

### Frontend
- XSS prevention (React escapes por defecto)
- CSRF tokens para mutations
- Wallet signature verification
- Content Security Policy headers

## Performance Optimizations

### Smart Contracts
- Storage packing para reducir gas
- Minimal proxy pattern (EIP-1167) para deployments
- Batch operations donde sea posible
- Events indexados para queries eficientes

### Backend
- Redis caching para datos hot
- Database indexes en queries frecuentes
- Pagination en todas las listas
- Background workers para tasks pesados

### Frontend
- Next.js Image optimization
- Code splitting por ruta
- React.memo para components pesados
- TanStack Query para caching de API calls
- Optimistic updates para mejor UX

## Monitoring & Observability

- **Sentry**: Error tracking (frontend + backend)
- **Datadog**: APM y metrics
- **Indexer health**: Dead letter queue para failed events
- **Contract events**: Monitor con Tenderly/Defender
- **Uptime**: Pingdom para API availability

---

Esta arquitectura provee:
- **Escalabilidad**: Modular design permite escalar cada layer independientemente
- **Mantenibilidad**: Clear separation of concerns
- **Performance**: Optimizations en cada layer
- **Security**: Defense in depth approach
- **Developer Experience**: Type-safe end-to-end (tRPC + TypeScript)
