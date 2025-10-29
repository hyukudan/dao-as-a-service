"use client";

import { useState } from "react";
import { useBalance } from "wagmi";
import { formatEther } from "viem";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";

export function TreasuryTab({ treasuryAddress }: { treasuryAddress: `0x${string}` }) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Get ETH balance
  const { data: balance } = useBalance({
    address: treasuryAddress,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Treasury</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Withdraw
          </button>
        </div>
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

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          treasuryAddress={treasuryAddress}
          onClose={() => setShowDepositModal(false)}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          treasuryAddress={treasuryAddress}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
}
