"use client";

interface DAOInfo {
  name: string;
  creator: string;
  governance: string;
  treasury: string;
  membership: string;
  createdAt: bigint;
  memberCount: bigint;
}

export function OverviewTab({ dao, daoAddress }: { dao: DAOInfo; daoAddress: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">DAO Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">DAO Address</label>
            <p className="font-mono text-sm break-all">{daoAddress}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Creator</label>
            <p className="font-mono text-sm">
              {dao.creator.slice(0, 6)}...{dao.creator.slice(-4)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Governance</label>
            <p className="font-mono text-sm">
              {dao.governance.slice(0, 6)}...{dao.governance.slice(-4)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Treasury</label>
            <p className="font-mono text-sm">
              {dao.treasury.slice(0, 6)}...{dao.treasury.slice(-4)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Membership NFT</label>
            <p className="font-mono text-sm">
              {dao.membership.slice(0, 6)}...{dao.membership.slice(-4)}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Created</label>
            <p className="text-sm">
              {new Date(Number(dao.createdAt) * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {Number(dao.memberCount)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">Active</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">DAO Status</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.floor((Date.now() - Number(dao.createdAt) * 1000) / (1000 * 60 * 60 * 24))}d
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
