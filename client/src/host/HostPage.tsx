import { useAuth } from "./AuthProvider";

export function HostPage({ onBack }: { onBack: () => void }) {
  const { client, token, isPending, loginAction } = useAuth();

  return (
    <>
      <button className="back" onClick={() => onBack()}>
        Back
      </button>
      <h1>JukeMash!!!</h1>
      <h2>Host-mode</h2>
      {isPending ? (
        <p>Loading...</p>
      ) : client ? (
        <p>Logged in: {token}</p>
      ) : (
        <button onClick={() => loginAction()}>Log in with Spotify</button>
      )}
    </>
  );
}
