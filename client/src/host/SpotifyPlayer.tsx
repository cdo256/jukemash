import { useState, useEffect } from "react";

export function SpotifyPlayer({
  token,
  setDeviceId,
}: {
  token: string;
  setDeviceId: (deviceId: string) => void;
}) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new Spotify.Player({
        name: "JukeMash",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      setPlayer(newPlayer);

      newPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with device id: ", device_id);
        setDeviceId(device_id);
      });

      newPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device Id has gone offline: ", device_id);
      });

      newPlayer.addListener("player_state_changed", (state) => {
        console.log("Player state changed: ", state);
      });

      newPlayer.connect();
    };

    return () => {
      player?.disconnect();
    };
  }, [token]);

  return <></>;
}
