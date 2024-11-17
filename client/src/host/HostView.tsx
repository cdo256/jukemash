import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSpotifyPlayer } from "./spotifyPlayer";

type HostState =
  | "PREINIT"
  | "LOBBY"
  | "ROUND_START"
  | "SONG_PLAYING"
  | "SONG_PAUSED"
  | "GAME_OVER";

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

function LobbyState({
  gameCode,
  onStartGame,
}: {
  gameCode: string;
  onStartGame: () => void;
}) {
  return (
    <>
      <h2>Game code: {gameCode}</h2>
      {/* TODO: List of players */}
      <button onClick={() => onStartGame()}>Start Game</button>
    </>
  );
}

function RoundStartState({
  roundIndex,
  gameCode,
  token,
  isPlayerReady,
  onPlaySong,
}: {
  roundIndex: number;
  gameCode: string;
  token: string;
  isPlayerReady: boolean;
  onPlaySong: (songUri: string) => void;
}) {
  const roundInfoQuery = useQuery({
    queryKey: ["roundInfo"],
    queryFn: async () => {
      return await axios.post("/api/round_info", {
        roundIndex,
        gameCode,
        spotifyAccessToken: token,
      });
    },
  });

  return (
    <button
      disabled={
        !isPlayerReady || roundInfoQuery.isPending || roundInfoQuery.isError
      }
      onClick={() => {
        if (roundInfoQuery.isPending || roundInfoQuery.isError) {
          return;
        }

        const title = roundInfoQuery.data.data.songTitle;
        const songUri = roundInfoQuery.data.data.spotifySongUri;

        onPlaySong(songUri);
      }}
    >
      Play Song
    </button>
  );
}

export function HostView({ token }: { token: string }) {
  const [hostState, setHostState] = useState<HostState>("PREINIT");
  const [gameCode, setGameCode] = useState<string>("");
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const { isPlayerReady, playSong } = useSpotifyPlayer(token);

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
    return (
      <LobbyState
        gameCode={gameCode}
        onStartGame={() => setHostState("ROUND_START")}
      />
    );
  } else if (hostState === "ROUND_START") {
    return (
      <RoundStartState
        roundIndex={roundIndex}
        gameCode={gameCode}
        token={token}
        isPlayerReady={isPlayerReady}
        onPlaySong={(songUri) => {
          playSong(songUri);
          setHostState("SONG_PLAYING");
        }}
      />
    );
  }
}
