export interface Deck {
  id: string;
  name: string;
  description?: string;

  totalCards: number;
  dueCards: number;

  createdAt: string;
}