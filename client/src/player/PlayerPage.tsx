import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

type GameState =
  | "UNCONNECTED"
  | "CONNECTING"
  | "WAITING"
  //| "GAME_START"
  | "ROUND_START"
  | "SONG_PLAYING"
  | "PLAYER_BUZZED"
  | "OTHER_BUZZED"
  | "ROUND_END";
//| "GAME_END";

export function PlayerPage({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<GameState>("UNCONNECTED");
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
      setState("WAITING");
    },
    onError: () => {
      setState("UNCONNECTED");
    },
  });

  if (state == "UNCONNECTED") {
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
