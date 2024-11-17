import { useMutation } from "@tanstack/react-query";
import axios, { AxiosInstance } from "axios";
import { createContext, useContext, useEffect, useState } from "react";

function getRedirectUri() {
  return window.location.origin + "/host";
}

function generateRandomString(length: number) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlEncode(input: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getToken(): Promise<string | null> {
  if (window.location.pathname !== "/host") {
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get("code");
  if (code === null) {
    return null;
  }
  window.history.replaceState(
    {},
    document.title,
    window.location.origin + window.location.pathname,
  );

  // stored in loginAction
  const codeVerifier = window.localStorage.getItem("code_verifier");
  if (codeVerifier === null) {
    return null;
  }

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = getRedirectUri();

  const payload = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const config = {
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: payload,
  };

  const response = await axios(config);

  return response.data.access_token;
}

type AuthData = {
  client: AxiosInstance | null;
  token: string | null;
  isPending: boolean;
  loginAction: () => Promise<void>;
};

const AuthContext = createContext<AuthData>({
  client: null,
  token: null,
  isPending: false,
  loginAction: async () => {},
});

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<AxiosInstance | null>(null);
  const fetchToken = useMutation({
    mutationFn: () => getToken(),
    onSuccess: (accessToken) => {
      if (accessToken === null) {
        setClient(null);
        setToken(null);
        return;
      }

      const spotifyClient = axios.create({
        baseURL: "https://api.spotify.com/v1/",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      setToken(accessToken);
      setClient(spotifyClient);
    },
  });
  const isPending = fetchToken.isPending;

  useEffect(() => {
    fetchToken.mutate();
  }, []);

  const loginAction = async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64urlEncode(hashed);

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = getRedirectUri();

    const scope = "streaming";
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    window.localStorage.setItem("code_verifier", codeVerifier);

    const params = {
      response_type: "code",
      client_id: clientId,
      scope,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  return (
    <AuthContext.Provider value={{ client, token, isPending, loginAction }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
