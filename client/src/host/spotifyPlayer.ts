import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

export function useSpotifyPlayer(token: string) {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playSongMutation = useMutation({
    mutationFn: async (spotifySongUri: string) => {
      if (deviceId === null) {
        console.error("No device ID :(");
        return;
      }

      return await axios.put(
        "https://api.spotify.com/v1/me/player/play",
        { uris: [spotifySongUri], position_ms: 0 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { device_id: deviceId },
        },
      );
    },
  });

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

  const isPlayerReady = deviceId !== null;
  const playSong = (spotifySongUri: string) =>
    playSongMutation.mutate(spotifySongUri);

  return { isPlayerReady, playSong };
}
