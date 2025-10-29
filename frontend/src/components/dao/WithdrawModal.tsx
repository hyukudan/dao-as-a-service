"use client";

import { useState } from "react";
import { useCreateProposal } from "@/hooks/useProposals";
import { useDAO } from "@/hooks/useDAO";
import { parseEther, encodeFunctionData } from "viem";
import { TreasuryModuleABI } from "@/lib/contracts/abis";

export function WithdrawModal({
  treasuryAddress,
  onClose,
}: {
  treasuryAddress: `0x${string}`;
  onClose: () => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Get DAO info to get governance address
  const { dao } = useDAO(treasuryAddress); // Using treasury as dao address for now
  const { createProposal, isPending, isSuccess, error } = useCreateProposal(
    dao?.governance as `0x${string}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dao) return;

    // Encode the withdraw function call
    const calldata = encodeFunctionData({
      abi: TreasuryModuleABI,
      functionName: "withdraw",
      args: [
        "0x0000000000000000000000000000000000000000" as `0x${string}`, // ETH address (zero address)
        parseEther(amount),
        recipient as `0x${string}`,
      ],
    });

    // Create proposal to withdraw
    await createProposal(
      `Withdraw ${amount} ETH`,
      description || `Withdraw ${amount} ETH from treasury to ${recipient}`,
      [treasuryAddress], // target
      [BigInt(0)], // value
      [calldata] // calldata
    );
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Proposal Created!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              A proposal has been created to withdraw {amount} ETH. Members can now vote on it.
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
        <h2 className="text-2xl font-bold mb-6">Withdraw from Treasury</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
              required
            />
          </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the reason for this withdrawal..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This will create a proposal that requires DAO member voting. The withdrawal will only execute if the proposal passes.
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
              disabled={isPending || !amount || !recipient}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
