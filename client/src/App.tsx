import { useState } from "react";
import { HostPage } from "./host/HostPage";
import { PlayerPage } from "./player/PlayerPage";

type Page = "HOME" | "HOST" | "PLAYER";

function HomePage({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <>
      <h1>JukeMash!!!</h1>
      <button onClick={() => setPage("HOST")}>Host Game</button>
      <button onClick={() => setPage("PLAYER")}>Join Game</button>
    </>
  );
}

export function App() {
  let initialPage: Page = "HOME";
  switch (window.location.pathname) {
    case "/host":
      initialPage = "HOST";
      break;
    case "/join":
      initialPage = "PLAYER";
      break;
  }

  const [page, setPage] = useState<Page>(initialPage);

  const switchPage = (newPage: Page) => {
    setPage(newPage);

    let newPath;
    switch (newPage) {
      case "HOME": {
        newPath = "/";
        break;
      }
      case "HOST": {
        newPath = "/host";
        break;
      }
      case "PLAYER": {
        newPath = "/join";
        break;
      }
    }

    window.history.replaceState(
      {},
      document.title,
      window.location.origin + newPath,
    );
  };

  switch (page) {
    case "HOME": {
      return <HomePage setPage={(page) => switchPage(page)} />;
    }
    case "HOST": {
      return <HostPage onBack={() => switchPage("HOME")} />;
    }
    case "PLAYER": {
      return <PlayerPage onBack={() => switchPage("HOME")} />;
    }
  }
}
