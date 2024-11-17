import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { SpotifyPlayer } from "./SpotifyPlayer";

type HostState =
  | "PREINIT"
  | "LOBBY"
  | "ROUND_START"
  | "SONG_PLAYING"
  | "SONG_PAUSED"
  | "GAME_OVER";

async function playSong(token: string, deviceId: string, gameCode: string) {
  const resp = await axios.post("/api/round_info", {
    spotifyAccessToken: token,
    gameCode: gameCode,
    roundIndex: 0,
  });
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

function PlayButton({ token, gameCode }: { token: string; gameCode: string }) {
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

function PreinitState({ onInit }: { onInit: (gameCode: string) => void }) {
  const createGameMutation = useMutation({
    mutationFn: async () => {
      return await axios.post("/api/create_game", {
        userId: "todo: uuid",
        gameMode: "guess",
      });
    },
    onSuccess: (response) => {
      onInit(response.data.gameCode);
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

  return <></>;
}

function LobbyState({ gameCode }: { gameCode: string }) {
  return (
    <>
      <h2>Game code: {gameCode}</h2>
      {/* TODO: List of players */}
      {/* <PlayButton token={token} gameCode={gameCode} /> */}
    </>
  );
}

export function HostView({ token }: { token: string }) {
  const [hostState, setHostState] = useState<HostState>("PREINIT");
  const [gameCode, setGameCode] = useState<string>("");

  if (hostState === "PREINIT") {
    return (
      <PreinitState
        onInit={(newGameCode) => {
          setGameCode(newGameCode);
          setHostState("LOBBY");
        }}
      />
    );
  } else if (hostState === "LOBBY") {
    return <LobbyState gameCode={gameCode} />;
  }
}
