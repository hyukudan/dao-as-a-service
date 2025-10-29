"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { GovernanceModuleABI } from "@/lib/contracts/abis";

export function useProposalCount(governanceAddress: `0x${string}` | undefined) {
  const { data, isLoading } = useReadContract({
    address: governanceAddress,
    abi: GovernanceModuleABI,
    functionName: "proposalCount",
    query: {
      enabled: !!governanceAddress,
    },
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
  };
}

export function useProposal(governanceAddress: `0x${string}` | undefined, proposalId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: governanceAddress,
    abi: GovernanceModuleABI,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: !!governanceAddress && proposalId !== undefined,
    },
  });

  return {
    proposal: data,
    isLoading,
    error,
    refetch,
  };
}

export function useProposalState(governanceAddress: `0x${string}` | undefined, proposalId: bigint | undefined) {
  const { data, isLoading } = useReadContract({
    address: governanceAddress,
    abi: GovernanceModuleABI,
    functionName: "state",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: !!governanceAddress && proposalId !== undefined,
    },
  });

  const stateNames = ["Pending", "Active", "Defeated", "Succeeded", "Executed", "Canceled"];

  return {
    state: data !== undefined ? stateNames[Number(data)] : null,
    stateId: data !== undefined ? Number(data) : null,
    isLoading,
  };
}

export function useCreateProposal(governanceAddress: `0x${string}` | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createProposal = async (
    title: string,
    description: string,
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[]
  ) => {
    if (!governanceAddress) throw new Error("Governance address not set");

    writeContract({
      address: governanceAddress,
      abi: GovernanceModuleABI,
      functionName: "propose",
      args: [title, description, targets, values, calldatas],
    });
  };

  return {
    createProposal,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

export function useVote(governanceAddress: `0x${string}` | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const vote = async (proposalId: bigint, support: 0 | 1 | 2) => {
    if (!governanceAddress) throw new Error("Governance address not set");

    writeContract({
      address: governanceAddress,
      abi: GovernanceModuleABI,
      functionName: "vote",
      args: [proposalId, support],
    });
  };

  return {
    vote,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}
