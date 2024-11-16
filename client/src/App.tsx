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
  let initialPage: Page = "HOME";
  switch (window.location.pathname) {
    case `${import.meta.env.BASE_URL}/host`:
      initialPage = "HOST";
      break;
    case `${import.meta.env.BASE_URL}/join`:
      initialPage = "PLAYER";
      break;
  }

  const [page, setPage] = useState<Page>(initialPage);

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
