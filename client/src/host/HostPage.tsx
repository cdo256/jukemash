export function HostPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <button onClick={() => onBack()}>Back</button>
      <p>Host Page</p>
    </>
  );
}
