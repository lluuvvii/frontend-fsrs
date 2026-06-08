export default function MaterialDetailPage() {
  const cards = [
    {
      id: 1,
      front: "Ar-Rahman",
      back: "Yang Maha Pengasih",
    },
    {
      id: 2,
      front: "Ar-Rahim",
      back: "Yang Maha Penyayang",
    },
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Asmaul Husna
        </h1>

        <button className="rounded-lg bg-green-600 px-4 py-2 text-white">
          Mulai Review
        </button>
      </div>

      <div className="space-y-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border bg-white p-4"
          >
            <h3 className="font-semibold">
              {card.front}
            </h3>

            <p className="text-gray-500">
              {card.back}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}