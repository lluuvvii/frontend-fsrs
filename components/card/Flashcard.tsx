"use client";

import { useState } from "react";

export default function Flashcard() {
  const [showAnswer, setShowAnswer] =
    useState(false);

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl bg-white p-10 text-center shadow">
        <h2 className="text-4xl font-bold">
          Ar-Rahman
        </h2>

        {showAnswer && (
          <p className="mt-6 text-xl">
            Yang Maha Pengasih
          </p>
        )}

        {!showAnswer && (
          <button
            onClick={() =>
              setShowAnswer(true)
            }
            className="mt-8 rounded-lg bg-blue-600 px-5 py-3 text-white"
          >
            Tampilkan Jawaban
          </button>
        )}
      </div>
    </div>
  );
}