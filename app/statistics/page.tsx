export default function StatisticsPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Statistik
      </h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2>Total Hafalan</h2>
          <p className="mt-2 text-3xl font-bold">
            159
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2>Review Hari Ini</h2>
          <p className="mt-2 text-3xl font-bold">
            24
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2>Sudah Dikuasai</h2>
          <p className="mt-2 text-3xl font-bold">
            83
          </p>
        </div>
      </div>
    </main>
  );
}