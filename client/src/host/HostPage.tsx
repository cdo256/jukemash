export function HostPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <h1>JukeMash!!!</h1>
      <h2>Host-mode</h2>
      <button className='back' onClick={() => onBack()}>Back</button>
    </>
  );
}
