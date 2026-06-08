interface Card {
  _id: string;
  front: string;
  back: string;

  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: string;

  deckId: string;
}