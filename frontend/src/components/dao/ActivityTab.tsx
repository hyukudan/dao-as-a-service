"use client";

import { trpc } from "@/lib/api/client";

const activityIcons = {
  DAOCreated: "🎉",
  MemberAdded: "👤",
  MemberRemoved: "👋",
  ProposalCreated: "📝",
  VoteCast: "🗳️",
  ProposalExecuted: "✅",
  TreasuryDeposit: "💰",
  TreasuryWithdrawal: "💸",
};

const activityColors = {
  DAOCreated: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  MemberAdded: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  MemberRemoved: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  ProposalCreated: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  VoteCast: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  ProposalExecuted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  TreasuryDeposit: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  TreasuryWithdrawal: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
};

function getRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function ActivityTab({ daoAddress }: { daoAddress: string }) {
  const { data, isLoading } = trpc.activity.list.useQuery({
    daoAddress,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 dark:border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((activity) => (
        <div
          key={activity.id}
          className="border rounded-lg p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="text-2xl flex-shrink-0">
              {activityIcons[activity.type as keyof typeof activityIcons] || "📌"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activityColors[activity.type as keyof typeof activityColors] ||
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {activity.type}
                </span>
                <span className="text-xs text-gray-500">
                  {getRelativeTime(activity.timestamp)}
                </span>
              </div>

              <div className="text-sm mb-1">
                <span className="font-semibold">
                  {activity.actor.slice(0, 6)}...{activity.actor.slice(-4)}
                </span>
                {" "}
                {getActivityDescription(activity.type, activity.metadata)}
              </div>

              {/* Transaction Hash */}
              {activity.metadata && typeof activity.metadata === 'object' && 'txHash' in activity.metadata && (
                <a
                  href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${activity.metadata.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-mono"
                >
                  {String(activity.metadata.txHash).slice(0, 10)}...
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getActivityDescription(type: string, metadata: any): string {
  switch (type) {
    case "DAOCreated":
      return "created this DAO";
    case "MemberAdded":
      return "joined the DAO";
    case "MemberRemoved":
      return "left the DAO";
    case "ProposalCreated":
      return `created proposal "${metadata?.title || "Untitled"}"`;
    case "VoteCast":
      return `voted ${metadata?.support === 1 ? "FOR" : metadata?.support === 0 ? "AGAINST" : "ABSTAIN"} on proposal`;
    case "ProposalExecuted":
      return "executed a proposal";
    case "TreasuryDeposit":
      return `deposited ${metadata?.amount ? `${Number(metadata.amount) / 1e18} ETH` : "funds"}`;
    case "TreasuryWithdrawal":
      return `withdrew ${metadata?.amount ? `${Number(metadata.amount) / 1e18} ETH` : "funds"}`;
    default:
      return "performed an action";
  }
}
