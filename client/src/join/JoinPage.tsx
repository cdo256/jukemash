export function JoinPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <button onClick={() => onBack()}>Back</button>
      <p>Join Page</p>
    </>
  );
}
