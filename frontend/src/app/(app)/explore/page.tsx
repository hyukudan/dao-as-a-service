"use client";

import { useDAOList, useDAOCount } from "@/hooks/useDAOList";
import Link from "next/link";

export default function ExplorePage() {
  const { count } = useDAOCount();
  const { daos, infos, isLoading } = useDAOList(0, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore DAOs</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {count} DAOs deployed on Attelyx Chain
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading DAOs...</p>
        </div>
      ) : daos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            No DAOs created yet
          </p>
          <Link
            href="/create"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create the First DAO
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {daos.map((dao, index) => {
            const info = infos[index];
            return (
              <Link
                key={dao}
                href={`/dao/${dao}`}
                className="border rounded-lg p-6 hover:shadow-lg transition-shadow dark:border-gray-700 dark:hover:border-blue-600"
              >
                <h3 className="text-xl font-semibold mb-2">{info.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-mono">
                  {dao.slice(0, 6)}...{dao.slice(-4)}
                </p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Creator:</span>{" "}
                    {info.creator.slice(0, 6)}...{info.creator.slice(-4)}
                  </p>
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>{" "}
                    {new Date(Number(info.createdAt) * 1000).toLocaleDateString()}
                  </p>
                  <p>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      info.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {info.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
