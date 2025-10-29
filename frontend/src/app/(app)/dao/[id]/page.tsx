"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useDAO, useDAOMembers } from "@/hooks/useDAO";
import { useProposalCount } from "@/hooks/useProposals";
import { ProposalsTab } from "@/components/dao/ProposalsTab";
import { MembersTab } from "@/components/dao/MembersTab";
import { TreasuryTab } from "@/components/dao/TreasuryTab";
import { OverviewTab } from "@/components/dao/OverviewTab";

type Tab = "overview" | "proposals" | "members" | "treasury";

export default function DAODetailPage() {
  const params = useParams();
  const daoAddress = params.id as `0x${string}`;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { dao, isLoading } = useDAO(daoAddress);
  const { members } = useDAOMembers(daoAddress);
  const { count: proposalCount } = useProposalCount(dao?.governance as `0x${string}`);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading DAO...</p>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">DAO Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The DAO at address {daoAddress} could not be found.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as Tab, name: "Overview", count: null },
    { id: "proposals" as Tab, name: "Proposals", count: proposalCount },
    { id: "members" as Tab, name: "Members", count: Number(dao.memberCount) },
    { id: "treasury" as Tab, name: "Treasury", count: null },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{dao.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
          {daoAddress}
        </p>
        <div className="flex gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Created:</span>{" "}
            {new Date(Number(dao.createdAt) * 1000).toLocaleDateString()}
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Members:</span>{" "}
            {Number(dao.memberCount)}
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Proposals:</span>{" "}
            {proposalCount}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab dao={dao} daoAddress={daoAddress} />}
      {activeTab === "proposals" && (
        <ProposalsTab
          governanceAddress={dao.governance as `0x${string}`}
          daoAddress={daoAddress}
        />
      )}
      {activeTab === "members" && (
        <MembersTab members={members} daoAddress={daoAddress} />
      )}
      {activeTab === "treasury" && (
        <TreasuryTab treasuryAddress={dao.treasury as `0x${string}`} />
      )}
    </div>
  );
}
