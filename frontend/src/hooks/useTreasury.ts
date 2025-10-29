"use client";

import { useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from "wagmi";
import { TreasuryModuleABI } from "@/lib/contracts/abis";
import { parseEther } from "viem";

export function useDepositETH(treasuryAddress: `0x${string}` | undefined) {
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (amount: string) => {
    if (!treasuryAddress) throw new Error("Treasury address not set");

    sendTransaction({
      to: treasuryAddress,
      value: parseEther(amount),
    });
  };

  return {
    deposit,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

export function useWithdraw(treasuryAddress: `0x${string}` | undefined) {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (token: `0x${string}`, amount: string, to: `0x${string}`) => {
    if (!treasuryAddress) throw new Error("Treasury address not set");

    writeContract({
      address: treasuryAddress,
      abi: TreasuryModuleABI,
      functionName: "withdraw",
      args: [token, parseEther(amount), to],
    });
  };

  return {
    withdraw,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}
