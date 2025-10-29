"use client";

import { useReadContract } from "wagmi";
import { DAOCoreABI } from "@/lib/contracts/abis";

export function useDAO(daoAddress: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: daoAddress,
    abi: DAOCoreABI,
    functionName: "getInfo",
    query: {
      enabled: !!daoAddress,
    },
  });

  return {
    dao: data
      ? {
          name: data[0],
          creator: data[1],
          governance: data[2],
          treasury: data[3],
          membership: data[4],
          createdAt: data[5],
          memberCount: data[6],
        }
      : null,
    isLoading,
    error,
    refetch,
  };
}

export function useDAOMembers(daoAddress: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: daoAddress,
    abi: DAOCoreABI,
    functionName: "getMembers",
    query: {
      enabled: !!daoAddress,
    },
  });

  return {
    members: data || [],
    isLoading,
    error,
  };
}
