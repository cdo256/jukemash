import json
import requests
from sqids import Sqids
import random
import datetime


def generate_game_code() -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    return Sqids(min_length=4, alphabet=alphabet).encode([random.randint(0, 15000)])

def current_timestamp():
    """Get the current timestamp as a string."""
    return "time"

def get_available_themes() -> list[str]:
    with open("data/playlists.json", "r") as f:
        themes_string =  f.read()
    themes = json.loads(themes_string)
    return themes.keys()

def select_song(theme: str, access_token: str) -> tuple[str, str]:
    """
    Given theme (can be empty) will select a song URI from the theme
    
    Returns:
        songURI - Spotify song URI
        title - song title
        artist - artist
        theme - Theme, if provided theme was not valid then this will be random
    """
    with open("data/playlists.json", "r") as f:
        themes_string =  f.read()
    themes = json.loads(themes_string)
    #print(themes)
    if theme not in themes:
        theme = random.choice(list(themes.keys()))
    
    playlist_url = themes[theme]["playlistLink"]

    # Extract the playlist ID from the URL
    playlist_id = playlist_url.split('/')[-1].split('?')[0]

    # Spotify API endpoint to get playlist tracks
    endpoint = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"

    # Set up headers with the access token
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Make a request to fetch tracks
    response = requests.get(endpoint, headers=headers)

    if response.status_code != 200:
        print(f"Failed to fetch tracks: {response.status_code}, {response.json()}")
        return None

    # Parse the response JSON
    data = response.json()
    items = data.get("items", [])

    if not items:
        print("No tracks found in the playlist.")
        return None

    # Select a random track
    random_track = random.choice(items)

    # Get the track URI
    track_uri = random_track.get("track", {}).get("uri")
    track_name = random_track.get("track", {}).get("name")
    track_artist = random_track.get("track", {}).get("artists")[0].get("name")
    print(track_artist)

    print(track_name)

    return track_uri, track_name, track_artist, theme

if __name__ == "__main__":
    s, t = select_song("", "BQCDyY5S8sMnhyK_O45s5yPRDEme-CKbSyZ9WEZHsQpA_teCw5I8fDFT_DW2nmlwo0thp6OHUbowXc7J4eTCfvKGf8gmGbAe8eQf-Cs5ZeCeKRs4FuQ")
    print(s)
    print(t)