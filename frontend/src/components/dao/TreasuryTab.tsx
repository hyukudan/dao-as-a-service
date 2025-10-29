"use client";

import { useReadContract, useBalance } from "wagmi";
import { TreasuryModuleABI } from "@/lib/contracts/abis";
import { formatEther } from "viem";

export function TreasuryTab({ treasuryAddress }: { treasuryAddress: `0x${string}` }) {
  // Get ETH balance
  const { data: balance } = useBalance({
    address: treasuryAddress,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Treasury</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Deposit Funds
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <div className="text-sm opacity-80 mb-2">Total Balance</div>
        <div className="text-4xl font-bold mb-4">
          {balance ? formatEther(balance.value) : "0"} {balance?.symbol || "ETH"}
        </div>
        <div className="text-sm opacity-80 font-mono">{treasuryAddress}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Deposits</div>
        </div>
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawals</div>
        </div>
        <div className="border rounded-lg p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
        </div>
      </div>
    </div>
  );
}
