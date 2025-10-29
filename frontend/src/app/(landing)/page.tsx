export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-6xl font-bold text-center mb-8">
          DAO-as-a-Service
        </h1>
        <p className="text-xl text-center mb-12 text-gray-600 dark:text-gray-300">
          Create and manage complex DAOs on Attelyx Chain with no code required
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-6 border rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">No-Code Setup</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Launch your DAO in minutes with our intuitive wizard. No technical knowledge required.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">Advanced Governance</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Multiple voting systems: Simple, Weighted, Quadratic, and Delegated voting.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">Dynamic NFTs</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fractional Dynamic NFT memberships with evolving voting power and revenue share.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <a
            href="/create"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create DAO
          </a>
          <a
            href="/explore"
            className="px-8 py-4 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          >
            Explore DAOs
          </a>
        </div>
      </div>
    </main>
  );
}
