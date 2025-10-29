"use client";

export function MembersTab({
  members,
  daoAddress,
}: {
  members: readonly `0x${string}`[];
  daoAddress: `0x${string}`;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Members</h2>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No members found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {members.map((member, index) => (
            <div
              key={member}
              className="border rounded-lg p-4 dark:border-gray-700 flex items-center justify-between"
            >
              <div>
                <p className="font-mono text-sm">{member}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Member #{index + 1}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">100</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Voting Power</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
