"use client";

import { useState, useMemo } from "react";
import { useDAOList, useDAOCount } from "@/hooks/useDAOList";
import Link from "next/link";

type StatusFilter = "all" | "active" | "inactive";

export default function ExplorePage() {
  const { count } = useDAOCount();
  const { daos, infos, isLoading } = useDAOList(0, 20);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Filter DAOs based on search and filters
  const filteredDAOs = useMemo(() => {
    if (!daos || !infos) return [];

    return daos
      .map((dao, index) => ({ address: dao, info: infos[index] }))
      .filter(({ address, info }) => {
        // Search filter (by name or address)
        const matchesSearch =
          searchQuery === "" ||
          info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && info.isActive) ||
          (statusFilter === "inactive" && !info.isActive);

        return matchesSearch && matchesStatus;
      });
  }, [daos, infos, searchQuery, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explore DAOs</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {count} DAOs deployed on Attelyx Chain
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by DAO name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All DAOs
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "active"
                ? "bg-green-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "inactive"
                ? "bg-red-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Results count */}
        {searchQuery && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {filteredDAOs.length} result{filteredDAOs.length !== 1 ? "s" : ""}
          </p>
        )}
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
      ) : filteredDAOs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            No DAOs found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDAOs.map(({ address, info }) => (
            <Link
              key={address}
              href={`/dao/${address}`}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow dark:border-gray-700 dark:hover:border-blue-600"
            >
              <h3 className="text-xl font-semibold mb-2">{info.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
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
          ))}
        </div>
      )}
    </div>
  );
}
