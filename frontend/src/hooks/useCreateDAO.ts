"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DAOFactoryABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useChainId } from "wagmi";

export interface DAOConfig {
  name: string;
  symbol: string;
  initialMembers: `0x${string}`[];
  votingPowers: bigint[];
  votingDelay: bigint;
  votingPeriod: bigint;
  proposalThreshold: bigint;
  quorumPercentage: bigint;
}

export function useCreateDAO() {
  const chainId = useChainId();
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createDAO = async (config: DAOConfig) => {
    const factoryAddress = getContractAddress(chainId, "DAOFactory");

    writeContract({
      address: factoryAddress as `0x${string}`,
      abi: DAOFactoryABI,
      functionName: "createDAO",
      args: [config],
    });
  };

  return {
    createDAO,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}
