"use client";

import { useReadContract } from "wagmi";
import { DAOFactoryABI } from "@/lib/contracts/abis";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useChainId } from "wagmi";

export function useDAOList(offset: number = 0, limit: number = 10) {
  const chainId = useChainId();
  const factoryAddress = getContractAddress(chainId, "DAOFactory");

  const { data, isLoading, error, refetch } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: DAOFactoryABI,
    functionName: "getDAOs",
    args: [BigInt(offset), BigInt(limit)],
  });

  return {
    daos: data?.[0] || [],
    infos: data?.[1] || [],
    isLoading,
    error,
    refetch,
  };
}

export function useDAOCount() {
  const chainId = useChainId();
  const factoryAddress = getContractAddress(chainId, "DAOFactory");

  const { data, isLoading, error } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: DAOFactoryABI,
    functionName: "getDAOCount",
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
  };
}
