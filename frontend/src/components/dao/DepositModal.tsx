"use client";

import { useState } from "react";
import { useDepositETH } from "@/hooks/useTreasury";

export function DepositModal({
  treasuryAddress,
  onClose,
}: {
  treasuryAddress: `0x${string}`;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const { deposit, isPending, isSuccess, error } = useDepositETH(treasuryAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await deposit(amount);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Deposit Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {amount} ETH has been deposited to the treasury.
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Deposit ETH to Treasury</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 text-2xl border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono"
              required
              min="0.001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Min: 0.001 ETH
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This deposit will be added to the DAO's treasury and can only be withdrawn through governance proposals.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
              Error: {error.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !amount}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Depositing..." : "Deposit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
