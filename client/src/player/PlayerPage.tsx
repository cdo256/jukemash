export function PlayerPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <button onClick={() => onBack()}>Back</button>
      <p>Player Page</p>
    </>
  );
}
