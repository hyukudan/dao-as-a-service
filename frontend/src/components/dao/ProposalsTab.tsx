"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { GovernanceModuleABI } from "@/lib/contracts/abis";
import { useProposal, useProposalState, useVote } from "@/hooks/useProposals";
import { CreateProposalModal } from "./CreateProposalModal";

export function ProposalsTab({
  governanceAddress,
  daoAddress,
}: {
  governanceAddress: `0x${string}`;
  daoAddress: `0x${string}`;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get all proposal IDs
  const { data: proposalIds } = useReadContract({
    address: governanceAddress,
    abi: GovernanceModuleABI,
    functionName: "getAllProposalIds",
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Proposals</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Proposal
        </button>
      </div>

      {!proposalIds || proposalIds.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No proposals yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Proposal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {proposalIds.map((id) => (
            <ProposalCard
              key={id.toString()}
              proposalId={id}
              governanceAddress={governanceAddress}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProposalModal
          governanceAddress={governanceAddress}
          daoAddress={daoAddress}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function ProposalCard({
  proposalId,
  governanceAddress,
}: {
  proposalId: bigint;
  governanceAddress: `0x${string}`;
}) {
  const { proposal, isLoading } = useProposal(governanceAddress, proposalId);
  const { state, stateId } = useProposalState(governanceAddress, proposalId);
  const { vote, isPending } = useVote(governanceAddress);

  if (isLoading || !proposal) {
    return <div className="border rounded-lg p-6 animate-pulse bg-gray-50 dark:bg-gray-800" />;
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPercentage = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0;
  const againstPercentage = totalVotes > 0n ? Number((proposal.againstVotes * 100n) / totalVotes) : 0;

  const getStateColor = (state: string | null) => {
    switch (state) {
      case "Active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Succeeded":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Defeated":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Executed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "Canceled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="border rounded-lg p-6 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">{proposal.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(state)}`}>
              {state}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Proposed by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">{proposal.description}</p>
        </div>
      </div>

      {/* Voting Progress */}
      <div className="space-y-2 mb-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600 dark:text-green-400">For</span>
            <span className="font-semibold">{forPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-600 dark:text-red-400">Against</span>
            <span className="font-semibold">{againstPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full"
              style={{ width: `${againstPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Vote Counts */}
      <div className="flex gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-600 dark:text-gray-400">For:</span>{" "}
          <span className="font-semibold">{proposal.forVotes.toString()}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Against:</span>{" "}
          <span className="font-semibold">{proposal.againstVotes.toString()}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Abstain:</span>{" "}
          <span className="font-semibold">{proposal.abstainVotes.toString()}</span>
        </div>
      </div>

      {/* Voting Buttons */}
      {stateId === 1 && ( // Active
        <div className="flex gap-3">
          <button
            onClick={() => vote(proposalId, 1)}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Vote For
          </button>
          <button
            onClick={() => vote(proposalId, 0)}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Vote Against
          </button>
          <button
            onClick={() => vote(proposalId, 2)}
            disabled={isPending}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Abstain
          </button>
        </div>
      )}
    </div>
  );
}
