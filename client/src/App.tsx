import { useState } from "react";
import { HostPage } from "./host/HostPage";
import { PlayerPage } from "./player/PlayerPage";

type Page = "HOME" | "HOST" | "PLAYER";

function HomePage({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <>
      <p>Home Page</p>
      <button onClick={() => setPage("HOST")}>Host Game</button>
      <button onClick={() => setPage("PLAYER")}>Join Game</button>
    </>
  );
}

export function App() {
  const [page, setPage] = useState<Page>("HOME");

  switch (page) {
    case "HOME": {
      return <HomePage setPage={(page) => setPage(page)} />;
    }
    case "HOST": {
      return <HostPage onBack={() => setPage("HOME")} />;
    }
    case "PLAYER": {
      return <PlayerPage onBack={() => setPage("HOME")} />;
    }
  }
}
