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
  onPlaySong: (songUri: string, songTitle: string, songArtist: string) => void;
}) {
  const roundInfoQuery = useQuery({
    queryKey: ["roundInfo", roundIndex],
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
        const artist = roundInfoQuery.data.data.songArtist;
        const songUri = roundInfoQuery.data.data.spotifySongUri;

        onPlaySong(songUri, title, artist);
      }}
    >
      Play Song
    </button>
  );
}

function SongPlayingState({
  gameCode,
  roundIndex,
  onBuzzIn,
}: {
  gameCode: string;
  roundIndex: number;
  onBuzzIn: (playerName: string) => void;
}) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["nextBuzzInQuery"],
    queryFn: async () => {
      return await axios.post("/api/next_buzz_in", {
        gameCode,
        roundIndex,
      });
    },
    refetchInterval: 200,
  });

  useEffect(() => {
    if (isError || isPending) {
      return;
    }

    if (data.data.name !== undefined) {
      onBuzzIn(data.data.name);
    }
  }, [data, isError, isPending]);

  return (
    <>
      <p>Song is playing...</p>
      <p>Buzz in to guess the song and artist!</p>
    </>
  );
}

function SongPausedState({
  gameCode,
  buzzedPlayerName,
  currentSong,
  onResult,
}: {
  gameCode: string;
  buzzedPlayerName: string;
  currentSong: { songTitle: string; songArtist: string };
  onResult: () => void;
}) {
  const [answerVisible, setAnswerVisible] = useState(false);
  const resultMutation = useMutation({
    mutationFn: async (result: "correct" | "incorrect") => {
      return await axios.post("/api/result", {
        gameCode,
        name: buzzedPlayerName,
        result,
      });
    },
    onSuccess: () => {
      onResult();
    },
  });

  return (
    <>
      <h1>{buzzedPlayerName} buzzed in! What is your guess?</h1>
      {answerVisible && (
        <h1>
          {currentSong.songTitle} by {currentSong.songArtist}
        </h1>
      )}
      {!answerVisible && (
        <button onClick={() => setAnswerVisible(true)}>Reveal Answer</button>
      )}
      <button onClick={() => resultMutation.mutate("correct")}>Correct</button>
      <button onClick={() => resultMutation.mutate("incorrect")}>
        Incorrect
      </button>
    </>
  );
}

function GameOverState({ gameCode }: { gameCode: string }) {
  const scoreboardQuery = useQuery({
    queryKey: ["scoreboard"],
    queryFn: async () => {
      return await axios.post("/api/get_scoreboard", { gameCode });
    },
  });

  if (scoreboardQuery.isPending) {
    return <h2>Loading...</h2>;
  }

  if (scoreboardQuery.isError) {
    return <h2>Error</h2>;
  }

  const playerName = scoreboardQuery.data.data.winner.name;
  const playerScore = scoreboardQuery.data.data.winner.score;

  return (
    <h1>
      {playerName} won the game with {playerScore}!
    </h1>
  );
}

export function HostView({ token }: { token: string }) {
  const [hostState, setHostState] = useState<HostState>("PREINIT");
  const [gameCode, setGameCode] = useState<string>("");
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [buzzedPlayerName, setBuzzedPlayerName] = useState<string>("");
  const { isPlayerReady, playSong, pauseSong } = useSpotifyPlayer(token);
  const [currentSong, setCurrentSong] = useState({
    songTitle: "",
    songArtist: "",
  });

  const nextRound = () => {
    //if (roundIndex >= 4) {
    setRoundIndex((r) => r + 1);
    // FIXME
    if (roundIndex >= 3) {
      setHostState("GAME_OVER");
      return;
    }

    setHostState("ROUND_START");
  };

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
        onPlaySong={(songUri, songTitle, songArtist) => {
          playSong(songUri);
          setCurrentSong({ songTitle, songArtist });
          setHostState("SONG_PLAYING");
        }}
      />
    );
  } else if (hostState === "SONG_PLAYING") {
    return (
      <SongPlayingState
        gameCode={gameCode}
        roundIndex={roundIndex}
        onBuzzIn={(playerName) => {
          setBuzzedPlayerName(playerName);
          pauseSong();
          setHostState("SONG_PAUSED");
        }}
      />
    );
  } else if (hostState === "SONG_PAUSED") {
    return (
      <SongPausedState
        gameCode={gameCode}
        buzzedPlayerName={buzzedPlayerName}
        currentSong={currentSong}
        onResult={() => nextRound()}
      />
    );
  } else if (hostState == "GAME_OVER") {
    return <GameOverState gameCode={gameCode} />;
  }
}
