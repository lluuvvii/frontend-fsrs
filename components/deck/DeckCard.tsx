import { Deck } from "@/types/deck";

type Props = {
  deck: Deck;
};

export default function DeckCard({ deck }: Props) {
  return (
    <div>
      <h3>{deck.name}</h3>
      <p>{deck.totalCards} cards</p>
    </div>
  );
}