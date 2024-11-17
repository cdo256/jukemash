import { useAuth } from "./AuthProvider";
import { HostView } from "./HostView";

export function HostPage({ onBack }: { onBack: () => void }) {
  const { token, isPending, loginAction } = useAuth();

  return (
    <>
      <h1>JukeMash!!!</h1>
      <h2>Host-mode</h2>
      {isPending ? (
        <>
          <p>Loading...</p>
          <button className="back" onClick={() => onBack()}></button>
        </>
      ) : token ? (
        <HostView token={token} />
      ) : (
        <>
          <button onClick={() => loginAction()}>Log in with Spotify</button>
          <button className="back" onClick={() => onBack()}></button>
        </>
      )}
    </>
  );
}
