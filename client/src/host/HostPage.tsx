import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

function SpotifyPlayer({
  token,
  setDeviceId,
}: {
  token: string;
  setDeviceId: (deviceId: string) => void;
}) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new Spotify.Player({
        name: "JukeMash",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      setPlayer(newPlayer);

      newPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with device id: ", device_id);
        setDeviceId(device_id);
      });

      newPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device Id has gone offline: ", device_id);
      });

      newPlayer.addListener("player_state_changed", (state) => {
        console.log("Player state changed: ", state);
      });

      newPlayer.connect();
    };

    return () => {
      player?.disconnect();
    };
  }, [token]);

  return <></>;
}

async function playSong(token: string, deviceId: string, gameCode: string) {
  const resp = await axios.post("/api/round_info", { spotifyAccessToken: token, gameCode: gameCode, roundIndex: 0})
  const spotifySongUri = resp.data.spotifySongUri;

  await axios.put(
    "https://api.spotify.com/v1/me/player/play",
    { uris: [spotifySongUri], position_ms: 0 },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { device_id: deviceId },
    },
  );
}

function PlayButton({ token, gameCode }: { token: string, gameCode: string }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playSongMutation = useMutation({
    mutationFn: async () => {
      if (deviceId === null) {
        console.error("No device ID :(");
        return;
      }

      return await playSong(token, deviceId, gameCode);
    },
  });

  return (
    <>
      <button
        disabled={deviceId === null}
        onClick={() => playSongMutation.mutate()}
      >
        Start Game
      </button>
      <SpotifyPlayer token={token} setDeviceId={setDeviceId} />
    </>
  );
}

function HostView({ token }: { token: string }) {
  const createGameMutation = useMutation({
    mutationFn: async () => {
      return await axios.post("/api/create_game", {
        userId: "todo: uuid",
        gameMode: "guess",
      });
    },
  });

  useEffect(() => {
    createGameMutation.mutate();
  }, []);

  if (createGameMutation.isPending) {
    return <p>Loading...</p>;
  }

  if (!createGameMutation.isSuccess) {
    return <p>Error</p>;
  }

  const gameCode = createGameMutation.data.data.gameCode;
  const gameMode = createGameMutation.data.data.gameMode;

  return (
    <>
      <p>Game code: {gameCode}</p>
      <p>Game mode: {gameMode}</p>
      <PlayButton token={token} gameCode={gameCode}/>
    </>
  );
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
      ) : spotifyClient && token ? (
        <HostView token={token} />
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
