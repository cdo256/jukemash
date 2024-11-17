import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

type GameState = "UNCONNECTED" | "CONNECTING" | "WAITING" | "GAME_START" | "ROUND_START" | "SONG_PLAYING" | "PLAYER_BUZZED" | "OTHER_BUZZED" | "ROUND_END" | "GAME_END";

interface ConnectProps {
  name: string;
  code: string;
  setState: (state: GameState) => void;
}

function connect({ name, code, setState }: ConnectProps) {
  console.log(`connect ${name} ${code}`)
  const connectMutation = useMutation({
    mutationFn: async () => {
      return await axios.post("/api/join_game", {
        name: name,
        gameCode: code
      })
    },
    onSuccess: () => {
      setState("WAITING");
    },
    onError: () => {
      setState("UNCONNECTED");
    }
  });
  useEffect(() => {
    connectMutation.mutate();
  }, []);
  
  //if (connectMutation.isPending) {
  //  return <p>Loading...</p>;
  //} else if (!connectMutation.isSuccess) {
  //  return <p>Error</p>;
  //}

  //return (
  //  <>
  //    <h1>JukeMash!!!</h1>
  //    <h2>Waiting for other players...</h2>
  //  </>
  //)
}

export function PlayerPage({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<GameState>("UNCONNECTED");
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');

  if (state == "UNCONNECTED") {
    return (<>
     <button className='back' onClick={onBack}></button>
      <label>Nickname:</label>
      <input type='text' value={name} onChange={(e) => setName(e.target.value)} /> 
      <label>4-letter connect code:</label>
      <input type='text' value={code} onChange={(e) => setCode(e.target.value)} /> 
      <button onClick={() => connect({name, code, setState})}>Connect</button>
    </>);
  } else if (state == "WAITING") {
    return (<><h2>Waiting for other players...</h2></>);
  } else {
    return (<><h2>Unknown state</h2></>);
  }
}
