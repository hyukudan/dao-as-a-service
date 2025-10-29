"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateDAO } from "@/hooks/useCreateDAO";
import { useAccount } from "wagmi";

interface DAOFormData {
  name: string;
  symbol: string;
  description: string;
  initialMembers: string[];
  votingPowers: string[];
  votingDelay: string;
  votingPeriod: string;
  proposalThreshold: string;
  quorumPercentage: string;
}

export default function CreateDAOPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { createDAO, isPending, isSuccess, error, txHash } = useCreateDAO();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DAOFormData>({
    name: "",
    symbol: "",
    description: "",
    initialMembers: [address || ""],
    votingPowers: ["100"],
    votingDelay: "1", // blocks
    votingPeriod: "100", // blocks (~5 minutes on 3s blocks)
    proposalThreshold: "1",
    quorumPercentage: "50",
  });

  const updateField = (field: keyof DAOFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addMember = () => {
    setFormData((prev) => ({
      ...prev,
      initialMembers: [...prev.initialMembers, ""],
      votingPowers: [...prev.votingPowers, "100"],
    }));
  };

  const removeMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      initialMembers: prev.initialMembers.filter((_, i) => i !== index),
      votingPowers: prev.votingPowers.filter((_, i) => i !== index),
    }));
  };

  const updateMember = (index: number, address: string) => {
    const newMembers = [...formData.initialMembers];
    newMembers[index] = address;
    setFormData((prev) => ({ ...prev, initialMembers: newMembers }));
  };

  const updateVotingPower = (index: number, power: string) => {
    const newPowers = [...formData.votingPowers];
    newPowers[index] = power;
    setFormData((prev) => ({ ...prev, votingPowers: newPowers }));
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }

    try {
      await createDAO({
        name: formData.name,
        symbol: formData.symbol,
        initialMembers: formData.initialMembers as `0x${string}`[],
        votingPowers: formData.votingPowers.map((p) => BigInt(p)),
        votingDelay: BigInt(formData.votingDelay),
        votingPeriod: BigInt(formData.votingPeriod),
        proposalThreshold: BigInt(formData.proposalThreshold),
        quorumPercentage: BigInt(formData.quorumPercentage),
      });
    } catch (err) {
      console.error("Error creating DAO:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Create Your DAO</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Please connect your wallet to continue
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold mb-4">DAO Created Successfully!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your DAO has been deployed on Attelyx Chain
        </p>
        {txHash && (
          <p className="text-sm text-gray-500 mb-8 font-mono break-all">
            Transaction: {txHash}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/explore")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View All DAOs
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Create Another DAO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Create Your DAO</h1>

      {/* Progress Steps */}
      <div className="flex mb-12">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s === step
                  ? "bg-blue-600 text-white"
                  : s < step
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 ${
                  s < step
                    ? "bg-green-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-2">DAO Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="My Awesome DAO"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Symbol</label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => updateField("symbol", e.target.value)}
              placeholder="DAO"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe your DAO's purpose..."
              rows={4}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!formData.name || !formData.symbol}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Governance Settings
          </button>
        </div>
      )}

      {/* Step 2: Governance */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Governance Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Voting Delay (blocks)
              </label>
              <input
                type="number"
                value={formData.votingDelay}
                onChange={(e) => updateField("votingDelay", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Delay before voting starts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Voting Period (blocks)
              </label>
              <input
                type="number"
                value={formData.votingPeriod}
                onChange={(e) => updateField("votingPeriod", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long voting lasts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Proposal Threshold
              </label>
              <input
                type="number"
                value={formData.proposalThreshold}
                onChange={(e) => updateField("proposalThreshold", e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min voting power to propose
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Quorum Percentage
              </label>
              <input
                type="number"
                value={formData.quorumPercentage}
                onChange={(e) => updateField("quorumPercentage", e.target.value)}
                min="1"
                max="100"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                % of votes needed to pass
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next: Members
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Members */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Initial Members</h2>

          {formData.initialMembers.map((member, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Member {index + 1} Address
                </label>
                <input
                  type="text"
                  value={member}
                  onChange={(e) => updateMember(index, e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-2">
                  Voting Power
                </label>
                <input
                  type="number"
                  value={formData.votingPowers[index]}
                  onChange={(e) => updateVotingPower(index, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              {index > 0 && (
                <button
                  onClick={() => removeMember(index)}
                  className="mt-8 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addMember}
            className="w-full px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
          >
            + Add Member
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Review & Deploy</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Basic Info</h3>
              <p className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>{" "}
                {formData.name}
              </p>
              <p className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Symbol:</span>{" "}
                {formData.symbol}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Governance</h3>
              <p className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Voting Delay:</span>{" "}
                {formData.votingDelay} blocks
              </p>
              <p className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Voting Period:</span>{" "}
                {formData.votingPeriod} blocks
              </p>
              <p className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Quorum:</span>{" "}
                {formData.quorumPercentage}%
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Members</h3>
              {formData.initialMembers.map((member, i) => (
                <p key={i} className="text-sm font-mono">
                  {member.slice(0, 6)}...{member.slice(-4)} - {formData.votingPowers[i]} votes
                </p>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
              Error: {error.message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Deploying..." : "Deploy DAO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
