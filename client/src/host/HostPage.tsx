import { AxiosInstance } from "axios";
import { useAuth } from "./AuthProvider";

function HostView({ spotifyClient }: { spotifyClient: AxiosInstance }) {
  return <p>Logged in</p>;
}

export function HostPage({ onBack }: { onBack: () => void }) {
  const { spotifyClient, token, isPending, loginAction } = useAuth();

  return (
    <>
      <h1>JukeMash!!!</h1>
      <h2>Host-mode</h2>
      {isPending ? (
        <>
          <p>Loading...</p>
          <button className="back" onClick={() => onBack()}>
            Back
          </button>
        </>
      ) : spotifyClient ? (
        <HostView spotifyClient={spotifyClient} />
      ) : (
        <>
          <button onClick={() => loginAction()}>Log in with Spotify</button>
          <button className="back" onClick={() => onBack()}>
            Back
          </button>
        </>
      )}
    </>
  );
}
