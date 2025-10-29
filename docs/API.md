# API Documentation

## Overview

The DAO-as-a-Service backend provides a type-safe API using tRPC. All endpoints return typed responses that are automatically validated.

**Base URL**: `http://localhost:3001` (development) or your deployed backend URL

## tRPC Endpoints

### Authentication

Currently, the API is public. Authentication will be added in future versions.

---

## DAO Endpoints

### `dao.list`

Get a paginated list of all DAOs.

**Input**:
```typescript
{
  page: number;     // Page number (default: 0)
  limit: number;    // Items per page (default: 10)
}
```

**Output**:
```typescript
{
  daos: Array<{
    id: string;
    address: string;
    name: string;
    description: string | null;
    creator: string;
    createdAt: Date;
    _count: {
      members: number;
      proposals: number;
    };
  }>;
  total: number;
  page: number;
  limit: number;
}
```

**Example**:
```typescript
const { daos, total } = await trpc.dao.list.query({
  page: 0,
  limit: 20,
});
```

---

### `dao.getByAddress`

Get detailed information about a specific DAO.

**Input**:
```typescript
string  // DAO address (0x...)
```

**Output**:
```typescript
{
  id: string;
  address: string;
  name: string;
  description: string | null;
  creator: string;
  createdAt: Date;
  members: Array<Member>;
  proposals: Array<Proposal>;
  activity: Array<Activity>;
  _count: {
    members: number;
    proposals: number;
  };
}
```

**Example**:
```typescript
const dao = await trpc.dao.getByAddress.query(
  "0x1234567890123456789012345678901234567890"
);
```

---

### `dao.getByCreator`

Get all DAOs created by a specific address.

**Input**:
```typescript
string  // Creator address (0x...)
```

**Output**:
```typescript
Array<{
  id: string;
  address: string;
  name: string;
  description: string | null;
  creator: string;
  createdAt: Date;
}>
```

**Example**:
```typescript
const daos = await trpc.dao.getByCreator.query(
  "0x1234567890123456789012345678901234567890"
);
```

---

## Proposal Endpoints

### `proposal.list`

Get all proposals for a specific DAO.

**Input**:
```typescript
{
  daoAddress: string;  // DAO address
  page?: number;       // Page number (default: 0)
  limit?: number;      // Items per page (default: 10)
}
```

**Output**:
```typescript
{
  proposals: Array<{
    id: string;
    proposalId: bigint;
    title: string;
    description: string;
    proposer: string;
    state: ProposalState;
    startBlock: bigint;
    endBlock: bigint;
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
    createdAt: Date;
    _count: {
      votes: number;
    };
  }>;
  total: number;
}
```

**Proposal States**:
- `Pending` - Not yet active
- `Active` - Currently accepting votes
- `Defeated` - Proposal failed
- `Succeeded` - Proposal passed
- `Executed` - Proposal executed
- `Canceled` - Proposal canceled

**Example**:
```typescript
const { proposals } = await trpc.proposal.list.query({
  daoAddress: "0x123...",
  page: 0,
  limit: 10,
});
```

---

### `proposal.getById`

Get detailed information about a specific proposal.

**Input**:
```typescript
{
  proposalId: string;  // On-chain proposal ID
}
```

**Output**:
```typescript
{
  id: string;
  proposalId: bigint;
  title: string;
  description: string;
  proposer: string;
  state: ProposalState;
  startBlock: bigint;
  endBlock: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  createdAt: Date;
  votes: Array<{
    id: string;
    support: number;  // 0 = Against, 1 = For, 2 = Abstain
    votingPower: bigint;
    reason: string | null;
    timestamp: Date;
    member: Member;
  }>;
  dao: DAO;
}
```

**Example**:
```typescript
const proposal = await trpc.proposal.getById.query({
  proposalId: "123",
});
```

---

## Member Endpoints

### `member.list`

Get all members of a DAO.

**Input**:
```typescript
string  // DAO address
```

**Output**:
```typescript
Array<{
  id: string;
  address: string;
  votingPower: bigint;
  sharePercentage: Decimal;
  joinedAt: Date;
}>
```

**Example**:
```typescript
const members = await trpc.member.list.query("0x123...");
```

---

### `member.getByAddress`

Get detailed information about a specific DAO member.

**Input**:
```typescript
{
  daoAddress: string;     // DAO address
  memberAddress: string;  // Member address
}
```

**Output**:
```typescript
{
  id: string;
  address: string;
  votingPower: bigint;
  sharePercentage: Decimal;
  joinedAt: Date;
  votes: Array<{
    id: string;
    support: number;
    votingPower: bigint;
    reason: string | null;
    timestamp: Date;
    proposal: {
      id: string;
      proposalId: bigint;
      title: string;
      state: ProposalState;
      createdAt: Date;
    };
  }>;
}
```

**Example**:
```typescript
const member = await trpc.member.getByAddress.query({
  daoAddress: "0x123...",
  memberAddress: "0x456...",
});
```

---

## Activity Endpoints

### `activity.list`

Get activity feed for DAOs.

**Input**:
```typescript
{
  daoAddress?: string;  // Filter by DAO (optional)
  actor?: string;       // Filter by actor (optional)
  type?: string;        // Filter by activity type (optional)
  limit?: number;       // Max items (default: 20, max: 100)
}
```

**Activity Types**:
- `DAOCreated` - New DAO created
- `MemberAdded` - Member joined
- `MemberRemoved` - Member left
- `ProposalCreated` - New proposal
- `VoteCast` - Vote cast on proposal
- `ProposalExecuted` - Proposal executed
- `TreasuryDeposit` - Funds deposited
- `TreasuryWithdrawal` - Funds withdrawn

**Output**:
```typescript
Array<{
  id: string;
  type: ActivityType;
  actor: string;
  metadata: Json;
  timestamp: Date;
  dao: {
    id: string;
    address: string;
    name: string;
  };
}>
```

**Example**:
```typescript
// Get all activity for a DAO
const activities = await trpc.activity.list.query({
  daoAddress: "0x123...",
  limit: 50,
});

// Get all votes cast
const votes = await trpc.activity.list.query({
  type: "VoteCast",
  limit: 100,
});
```

---

## Stats Endpoints

### `stats.global`

Get global platform statistics.

**Input**: None

**Output**:
```typescript
{
  daoCount: number;
  totalMembers: number;
  totalProposals: number;
  totalVotes: number;
}
```

**Example**:
```typescript
const stats = await trpc.stats.global.query();
```

---

### `stats.dao`

Get statistics for a specific DAO.

**Input**:
```typescript
string  // DAO address
```

**Output**:
```typescript
{
  members: number;
  proposals: number;
  activity: number;
  activeProposals: number;
}
```

**Example**:
```typescript
const daoStats = await trpc.stats.dao.query("0x123...");
```

---

## Usage with Frontend

### Setup tRPC Client

```typescript
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/src/trpc/router";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_API_URL + "/trpc",
    }),
  ],
});
```

### React Query Integration

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/backend/src/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

// In your component
function DAOList() {
  const { data, isLoading } = trpc.dao.list.useQuery({
    page: 0,
    limit: 10,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.daos.map((dao) => (
        <div key={dao.id}>{dao.name}</div>
      ))}
    </div>
  );
}
```

---

## Error Handling

tRPC automatically handles errors and returns typed error responses.

```typescript
try {
  const dao = await trpc.dao.getByAddress.query("invalid-address");
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.error("API Error:", error.message);
    console.error("Error Code:", error.data?.code);
  }
}
```

**Common Error Codes**:
- `BAD_REQUEST` - Invalid input
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

---

## Rate Limiting

Currently, there are no rate limits in development. Production deployments should implement rate limiting.

Recommended limits:
- 100 requests per minute per IP
- 1000 requests per hour per IP

---

## Webhooks (Coming Soon)

Future versions will support webhooks for:
- New DAO created
- Proposal state changed
- Vote cast
- Treasury transaction

---

## GraphQL Alternative (Future)

We plan to add a GraphQL endpoint as an alternative to tRPC for better public API access.

---

## Support

For API questions or issues:
- GitHub Issues: https://github.com/hyukudan/dao-as-a-service/issues
- Documentation: See README.md and DEVELOPMENT.md
