import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

type PlayerState =
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
  onStarted: (roundIndex: number) => void;
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
    if (!isPending && !isError && data.data.currentIndex >= 0) {
      onStarted(data.data.currentIndex);
    }
  }, [data, isPending, isError]);

  return <h2>Waiting for other players...</h2>;
}

function RoundStartState({
  name,
  gameCode,
  roundIndex,
}: {
  name: string;
  gameCode: string;
  roundIndex: number;
}) {
  const buzzInMutation = useMutation({
    mutationFn: async () => {
      return await axios.post("/api/buzz_in", {
        playerName: name,
        gameCode,
        roundIndex,
      });
    },
  });

  return (
    <>
      <h2>Round Start</h2>
      <button onClick={() => buzzInMutation.mutate()}>Buzz!</button>
    </>
  );
}

export function PlayerPage({ onBack }: { onBack: () => void }) {
  const [playerState, setPlayerState] = useState<PlayerState>("UNCONNECTED");
  const [name, setName] = useState<string>("");
  const [gameCode, setGameCode] = useState<string>("");
  const [roundIndex, setRoundIndex] = useState<number>(-1);

  if (playerState == "UNCONNECTED") {
    return (
      <UnconnectedState
        onBack={onBack}
        onConnect={(newName, newGameCode) => {
          setName(newName);
          setGameCode(newGameCode);
          setPlayerState("WAITING");
        }}
        onError={() => setPlayerState("UNCONNECTED")}
      />
    );
  } else if (playerState == "WAITING") {
    return (
      <WaitingState
        gameCode={gameCode}
        onStarted={(newRoundIndex) => {
          setRoundIndex(newRoundIndex);
          setPlayerState("ROUND_START");
        }}
      />
    );
  } else if (playerState == "ROUND_START") {
    return (
      <RoundStartState
        name={name}
        gameCode={gameCode}
        roundIndex={roundIndex}
      />
    );
  } else {
    return <h2>Unknown state</h2>;
  }
}
