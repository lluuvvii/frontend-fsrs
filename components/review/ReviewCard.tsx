type Props = {
  question: string;
  answer: string;
  showAnswer: boolean;
};

export default function ReviewCard({
  question,
  answer,
  showAnswer,
}: Props) {
  return (
    <div>
      <h2>{question}</h2>

      {showAnswer && (
        <p>{answer}</p>
      )}
    </div>
  );
}