import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { BlockchainIndexer } from "./indexer/blockchain";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// TODO: Add tRPC routes

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);

  // Start blockchain indexer if configured
  const rpcUrl = process.env.ATTELYX_RPC_URL;
  const factoryAddress = process.env.DAO_FACTORY_ADDRESS;

  if (rpcUrl && factoryAddress) {
    const indexer = new BlockchainIndexer(rpcUrl, factoryAddress);
    indexer.start().catch((error) => {
      console.error("Failed to start indexer:", error);
    });
  } else {
    console.warn("⚠️  Indexer not started - missing RPC_URL or FACTORY_ADDRESS");
  }
});
