# Deployment Guide - DAO-as-a-Service

## Production Deployment Checklist

### Prerequisites
- [x] Smart contracts compiled
- [x] Frontend built and tested
- [x] Backend indexer tested
- [x] Database schema ready
- [ ] Attelyx testnet/mainnet access
- [ ] Domain name configured
- [ ] SSL certificates
- [ ] Monitoring setup

---

## Step 1: Deploy Smart Contracts

### 1.1 Prepare Deployment Wallet

```bash
# Generate a new wallet for deployment (save mnemonic securely!)
# Or use existing wallet

# Fund the wallet with ATX tokens for gas
# Testnet: Use faucet
# Mainnet: Transfer ATX
```

### 1.2 Configure Environment

```bash
# .env configuration
ATTELYX_TESTNET_RPC_URL=https://testnet-rpc.attelyx.com
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### 1.3 Deploy Contracts

```bash
cd contracts

# Deploy to testnet
npm run deploy:testnet

# Expected output:
# ✅ DAOFactory deployed to: 0x...
# ✅ DAOCore implementation: 0x...
# ✅ GovernanceModule implementation: 0x...
# ✅ TreasuryModule implementation: 0x...
# ✅ FDNFTMembership implementation: 0x...

# Save these addresses!
```

### 1.4 Verify Contracts

```bash
# Verify on Attelyx Explorer
npm run verify -- --network testnet 0xDAOFactoryAddress

# Verify all implementation contracts
```

### 1.5 Update Configuration

```bash
# Update .env with deployed addresses
DAO_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_DAO_FACTORY_ADDRESS=0x...
```

---

## Step 2: Setup Database

### 2.1 Provision PostgreSQL

**Option A: Managed Service (Recommended)**
```bash
# Supabase, Neon, Railway, or similar
# Create database: dao_platform
# Copy connection string
```

**Option B: Self-hosted**
```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE dao_platform;
CREATE USER dao_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dao_platform TO dao_user;
```

### 2.2 Run Migrations

```bash
cd backend

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@host:5432/dao_platform

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Verify tables created
npm run db:studio
```

---

## Step 3: Deploy Backend

### 3.1 Prepare Production Build

```bash
cd backend

# Build TypeScript
npm run build

# Test built version locally
npm start
```

### 3.2 Deploy Options

**Option A: Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add environment variables via dashboard:
# - DATABASE_URL
# - ATTELYX_RPC_URL
# - DAO_FACTORY_ADDRESS
# - PORT=3001

# Deploy
railway up
```

**Option B: Docker**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t dao-backend .
docker run -p 3001:3001 --env-file .env dao-backend
```

**Option C: VPS (DigitalOcean, AWS EC2, etc.)**
```bash
# SSH into server
ssh user@your-server

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/your-org/dao-as-a-service
cd dao-as-a-service/backend

# Install dependencies
npm install

# Setup PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start npm --name "dao-backend" -- start
pm2 save
pm2 startup
```

### 3.3 Verify Backend

```bash
# Health check
curl https://your-backend-url.com/health

# Should return:
# {"status":"ok","timestamp":"2024-..."}

# Check indexer logs
# Should see: 🔍 Starting blockchain indexer...
```

---

## Step 4: Deploy Frontend

### 4.1 Configure Environment

```bash
cd frontend

# Create .env.production
NEXT_PUBLIC_CHAIN_ID=41338
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.attelyx.com
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_DAO_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_EXPLORER_URL=https://testnet-explorer.attelyx.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 4.2 Build Production

```bash
# Build
npm run build

# Test production build locally
npm start
```

### 4.3 Deploy Options

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables via dashboard
# Deploy to production
vercel --prod
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=.next
```

**Option C: Self-hosted with Nginx**
```bash
# Build on server
npm run build

# Install PM2
pm2 start npm --name "dao-frontend" -- start

# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable HTTPS with Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

---

## Step 5: Post-Deployment

### 5.1 Verify Full Stack

```bash
# 1. Check frontend loads
curl https://your-domain.com

# 2. Check backend API
curl https://your-backend.com/health

# 3. Check tRPC endpoint
curl https://your-backend.com/trpc/stats.global

# 4. Verify indexer is running
# Check logs for: ✅ Indexed DAO: ...
```

### 5.2 Test Complete Flow

1. **Connect Wallet**
   - Visit https://your-domain.com
   - Click "Connect Wallet"
   - Use MetaMask with Attelyx Testnet

2. **Create DAO**
   - Click "Create DAO"
   - Fill wizard
   - Sign transaction
   - Wait for confirmation
   - Verify DAO appears in "Explore"

3. **Create Proposal**
   - Navigate to DAO detail page
   - Click "Proposals" tab
   - Click "Create Proposal"
   - Fill form and submit
   - Verify proposal appears

4. **Vote**
   - Click "Vote For/Against"
   - Sign transaction
   - Verify vote counted

5. **Check Indexer**
   - Verify all events indexed in database
   - Check activity feed

### 5.3 Setup Monitoring

**Sentry (Error Tracking)**
```bash
# Install Sentry
npm install @sentry/nextjs @sentry/node

# Configure in .env
SENTRY_DSN=your_sentry_dsn
```

**Datadog (APM)**
```bash
# Install Datadog agent
# Configure APM for backend
```

**Uptime Monitoring**
- UptimeRobot
- Pingdom
- StatusCake

Monitor:
- Frontend uptime
- Backend /health endpoint
- Database connections
- Indexer status

---

## Step 6: CI/CD Setup

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Deploy contracts
        run: |
          cd contracts
          npm install
          npm run deploy:testnet
        env:
          DEPLOYER_PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Step 7: Security Checklist

- [ ] All private keys stored in environment variables (never in code)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting on API endpoints
- [ ] Database credentials rotated
- [ ] Smart contracts audited
- [ ] Environment variables not exposed in frontend
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain private keys
- [ ] Backup strategy in place

---

## Step 8: Performance Optimization

### Backend
```bash
# Enable Redis caching
REDIS_URL=redis://...

# Connection pooling for Prisma
DATABASE_CONNECTION_LIMIT=10
```

### Frontend
```bash
# Enable image optimization
# Configure CDN (Cloudflare, Vercel Edge Network)
# Enable gzip compression
```

### Database
```sql
-- Add indexes for common queries
CREATE INDEX idx_dao_creator ON "DAO"(creator);
CREATE INDEX idx_proposal_state ON "Proposal"(state);
CREATE INDEX idx_activity_timestamp ON "Activity"(timestamp DESC);
```

---

## Troubleshooting

### Indexer not picking up events
```bash
# Check RPC connection
curl -X POST $ATTELYX_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Restart indexer with fresh block
# Set fromBlock in backend logs
```

### Database connection issues
```bash
# Test connection
psql $DATABASE_URL

# Check connection limit
# Verify firewall rules
```

### Frontend wallet connection fails
```bash
# Verify chain ID matches
# Check RPC URL is accessible
# Verify WalletConnect project ID
```

---

## Maintenance

### Regular Tasks

**Daily**
- Monitor error rates (Sentry)
- Check indexer sync status
- Verify API health

**Weekly**
- Review database size and performance
- Check for dependency updates
- Review logs for anomalies

**Monthly**
- Rotate credentials
- Review and optimize database queries
- Update dependencies
- Backup database

---

## Rollback Plan

If deployment fails:

```bash
# 1. Rollback frontend
vercel rollback

# 2. Rollback backend
railway rollback

# 3. Restore database
pg_restore -d dao_platform backup.dump

# 4. Redeploy contracts (if needed - USE CAUTION)
# Note: Contract deployments are permanent
```

---

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Discord: Community support
- Email: support@dao-platform.com

---

## Next Steps After Deployment

1. [ ] Announce on social media
2. [ ] Write launch blog post
3. [ ] Submit to DeFi aggregators
4. [ ] Create video tutorials
5. [ ] Start marketing campaigns
6. [ ] Gather user feedback
7. [ ] Iterate based on usage patterns
