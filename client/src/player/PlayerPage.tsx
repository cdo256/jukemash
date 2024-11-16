export function PlayerPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <h1>JukeMash!!!</h1>
      <h2>Player-mode</h2>
      <button onClick={() => onBack()}>Back</button>
    </>
  );
}
