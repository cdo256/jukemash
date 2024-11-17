import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

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
  onConnect: () => void;
  onError: () => void;
}) {
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const connectMutation = useMutation({
    mutationFn: async () => {
      console.log(`connect ${name} ${code}`);
      return await axios.post("/api/join_game", {
        name: name,
        gameCode: code,
      });
    },
    onSuccess: () => {
      onConnect();
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
        value={code}
        onChange={(e) => setCode(e.target.value)}
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

export function PlayerPage({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<GameState>("UNCONNECTED");
  if (state == "UNCONNECTED") {
    return (
      <UnconnectedState
        onBack={onBack}
        onConnect={() => setState("WAITING")}
        onError={() => setState("UNCONNECTED")}
      />
    );
  } else if (state == "WAITING") {
    return (
      <>
        <h2>Waiting for other players...</h2>
      </>
    );
  } else {
    return (
      <>
        <h2>Unknown state</h2>
      </>
    );
  }
}
