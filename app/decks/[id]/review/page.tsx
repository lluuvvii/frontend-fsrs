import Flashcard from "@/components/card/Flashcard";

export default function ReviewPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Review Hafalan
      </h1>

      <Flashcard />

      <div className="mx-auto mt-8 flex max-w-xl gap-2">
        <button className="flex-1 rounded-lg bg-red-500 py-3 text-white">
          Again
        </button>

        <button className="flex-1 rounded-lg bg-orange-500 py-3 text-white">
          Hard
        </button>

        <button className="flex-1 rounded-lg bg-blue-500 py-3 text-white">
          Good
        </button>

        <button className="flex-1 rounded-lg bg-green-500 py-3 text-white">
          Easy
        </button>
      </div>
    </main>
  );
}