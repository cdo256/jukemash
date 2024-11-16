import { useState } from "react";
import { HostPage } from "./host/HostPage";
import { JoinPage } from "./join/JoinPage";

type Page = "HOME" | "HOST" | "JOIN";

function HomePage({ setPage }: { setPage: (page: Page) => void }) {
  return <>
    <p>Home Page</p>
    <button onClick={() => setPage("HOST")}>Host Game</button>
    <button onClick={() => setPage("JOIN")}>Join Game</button>
  </>;
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
    case "JOIN": {
      return <JoinPage onBack={() => setPage("HOME")} />;
    }
  }
}
