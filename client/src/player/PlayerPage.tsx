import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

type GameState =
  | "UNCONNECTED"
  | "WAITING"
  | "ROUND_START"
  | "SONG_PLAYING"
  | "PLAYER_BUZZED"
  | "OTHER_BUZZED"
  | "ROUND_END";

function UnconnectedState({
  onBack,
  onConnect,
  onError,
}: {
  onBack: () => void;
  onConnect: (name: string, gameCode: string) => void;
  onError: () => void;
}) {
  const [name, setName] = useState<string>("");
  const [gameCode, setGameCode] = useState<string>("");
  const connectMutation = useMutation({
    mutationFn: async () => {
      console.log(`connect ${name} ${gameCode}`);
      return await axios.post("/api/join_game", {
        name,
        gameCode,
      });
    },
    onSuccess: () => {
      onConnect(name, gameCode);
    },
    onError: () => {
      onError();
    },
  });

  return (
    <>
      <button className="back" onClick={onBack}></button>
      <label>Nickname:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label>4-letter connect code:</label>
      <input
        type="text"
        value={gameCode}
        onChange={(e) => setGameCode(e.target.value)}
      />
      <button
        disabled={connectMutation.isPending}
        onClick={() => connectMutation.mutate()}
      >
        Connect
      </button>
    </>
  );
}

function WaitingState({
  gameCode,
  onStarted,
}: {
  gameCode: string;
  onStarted: () => void;
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["currentRound"],
    queryFn: async () => {
      console.log("current round");
      return await axios.post("/api/current_round", {
        gameCode,
      });
    },
    refetchInterval: 200,
  });

  useEffect(() => {
    if (!isPending && !isError && data.data.roundNumber > 0) {
      onStarted();
    }
  }, [data]);

  return <h2>Waiting for other players...</h2>;
}

export function PlayerPage({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>("UNCONNECTED");
  const [name, setName] = useState<string>("");
  const [gameCode, setGameCode] = useState<string>("");

  if (gameState == "UNCONNECTED") {
    return (
      <UnconnectedState
        onBack={onBack}
        onConnect={(newName, newGameCode) => {
          setName(newName);
          setGameCode(newGameCode);
          setGameState("WAITING");
        }}
        onError={() => setGameState("UNCONNECTED")}
      />
    );
  } else if (gameState == "WAITING") {
    return (
      <WaitingState
        gameCode={gameCode}
        onStarted={() => setGameState("ROUND_START")}
      />
    );
  } else if (gameState == "ROUND_START") {
    return <h2>Round Start</h2>;
  } else {
    return <h2>Unknown state</h2>;
  }
}
