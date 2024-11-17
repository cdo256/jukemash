import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

type GameState = "UNCONNECTED" | "WAITING" | "GAME_START" | "ROUND_START" | "SONG_PLAYING" | "PLAYER_BUZZED" | "OTHER_BUZZED" | "ROUND_END" | "GAME_END";

function Connect(name: string, code: string) {
  const connectMutation = useMutation({
    mutationFn: async () => {
      return await axios.post("/api/join_game", {
        name: name,
        gameCode: code
      })
    }
  });
  return (
    <>
      <h1>JukeMash!!!</h1>
      <h2>Waiting for other players...</h2>
    </>
  )
}

export function PlayerPage({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  let page = null;
  //if (state == "UNCONNECTED") {
    page = (<>
     <button className='back' onClick={() => onBack()}></button>
      <label>Nickname:</label>
      <input type='text' value={name} onChange={(e) => setName(e.target.value)} /> 
      <label>4-letter connect code:</label>
      <input type='text' value={code} onChange={(e) => setCode(e.target.value)} /> 
      <button onClick={() => Connect(name, code)}>Connect</button>
    </>);
  //} 
  return page;
}
