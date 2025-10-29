# Development Guide - DAO-as-a-Service

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database
- Git

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install individually
cd contracts && npm install
cd ../frontend && npm install
cd ../backend && npm install
```

### 2. Setup Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required variables:**
```env
# Blockchain
ATTELYX_RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dao_platform

# Frontend
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_DAO_FACTORY_ADDRESS=  # Will be filled after deployment
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### 3. Deploy Smart Contracts

```bash
# Start local Attelyx devnet (if available)
# Or use existing testnet

# Compile contracts
cd contracts
npm run compile

# Deploy to devnet
npm run deploy:devnet

# Copy the deployed DAO_FACTORY_ADDRESS to .env
```

### 4. Setup Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 5. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

## Development Workflow

### Smart Contract Development

```bash
cd contracts

# Write your Solidity code in src/

# Compile
npm run compile

# Run tests
npm run test

# Deploy to devnet
npm run deploy:devnet

# Deploy to testnet
npm run deploy:testnet

# Clean artifacts
npm run clean
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

**File Structure:**
```
frontend/src/
├── app/              # Next.js App Router
│   ├── (landing)/   # Landing page
│   └── (app)/       # Main app (requires wallet)
│       ├── create/  # DAO creation wizard
│       ├── explore/ # Browse DAOs
│       └── dao/[id]/# DAO detail page
├── components/      # React components
├── hooks/           # Custom React hooks
└── lib/
    ├── web3/       # Web3 config (wagmi, viem)
    └── contracts/  # ABIs and addresses
```

### Backend Development

```bash
cd backend

# Start dev server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start

# Database operations
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio GUI
```

**File Structure:**
```
backend/src/
├── index.ts            # Express server entry
├── indexer/
│   ├── blockchain.ts   # Event indexer
│   └── contracts.ts    # Contract ABIs
├── api/               # (TODO) tRPC routers
└── workers/           # (TODO) Background jobs
```

## Testing

### Smart Contracts

```bash
cd contracts

# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Run coverage
npm run coverage
```

### Frontend

```bash
cd frontend

# Run type check
npm run type-check

# Build to check for errors
npm run build
```

## Common Tasks

### Create a New DAO (via UI)

1. Start frontend dev server
2. Navigate to http://localhost:3000
3. Click "Create DAO"
4. Connect your wallet (MetaMask, etc.)
5. Fill in the 4-step wizard:
   - Basic Info
   - Governance Settings
   - Initial Members
   - Review & Deploy
6. Sign transaction
7. Wait for confirmation
8. DAO is now visible on "Explore" page

### Query DAOs Programmatically

**Using hooks (in React components):**
```typescript
import { useDAOList, useDAOCount } from '@/hooks/useDAOList';

function MyComponent() {
  const { count } = useDAOCount();
  const { daos, infos, isLoading } = useDAOList(0, 10);

  // ...
}
```

**Using Prisma (in backend):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const daos = await prisma.dao.findMany({
  include: {
    members: true,
    proposals: true,
  },
});
```

### Add a New Contract Event

1. **Update contract to emit event:**
```solidity
event MyNewEvent(address indexed param1, uint256 param2);
emit MyNewEvent(msg.sender, value);
```

2. **Add ABI to backend:**
```typescript
// backend/src/indexer/contracts.ts
export const MyContractABI = [
  {
    type: "event",
    name: "MyNewEvent",
    inputs: [
      { name: "param1", type: "address", indexed: true },
      { name: "param2", type: "uint256", indexed: false },
    ],
  },
] as const;
```

3. **Add event handler:**
```typescript
// backend/src/indexer/blockchain.ts
contract.on("MyNewEvent", async (param1, param2, event) => {
  await this.handleMyNewEvent(event);
});

private async handleMyNewEvent(event: any) {
  // Save to database
}
```

4. **Update Prisma schema if needed:**
```prisma
model Activity {
  // Add new activity type to enum
}

enum ActivityType {
  // ...
  MyNewEvent
}
```

5. **Regenerate Prisma client:**
```bash
npm run db:generate
npm run db:push
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend build errors
```bash
cd frontend
npm run type-check  # Check TypeScript errors
```

### Database connection errors
```bash
# Check DATABASE_URL is correct
# Ensure PostgreSQL is running
psql -U user -d dao_platform  # Test connection
```

### Indexer not starting
```bash
# Check these environment variables are set:
ATTELYX_RPC_URL=...
DAO_FACTORY_ADDRESS=...

# Check RPC is accessible
curl -X POST $ATTELYX_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Transactions failing
- Check you have sufficient balance for gas
- Verify correct network is selected in wallet
- Check contract addresses are correct in .env
- Review transaction error in block explorer

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  Connects to wallet → Sends transactions to blockchain      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├→ Direct RPC calls (wagmi/viem)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Attelyx Blockchain                         │
│  Smart Contracts: DAOFactory, DAOCore, Governance, etc.     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Events emitted
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Backend Indexer                          │
│  Listens to events → Stores in PostgreSQL                   │
│  Provides indexed data via API (future: tRPC)               │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

- [ ] Implement DAO detail page (`/dao/[id]`)
- [ ] Add proposal creation UI
- [ ] Add voting interface
- [ ] Implement tRPC API routes
- [ ] Add treasury management UI
- [ ] Create member management page
- [ ] Add activity feed component
- [ ] Implement search and filters
- [ ] Add unit tests
- [ ] Add E2E tests with Playwright

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
