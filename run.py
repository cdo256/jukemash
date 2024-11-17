import json
import os
import datetime

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room

import utils

game_rooms = {}
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route("/")
def home():
    return send_from_directory("static", "index.html")


@app.route("/host")
def host():
    return send_from_directory("static", "index.html")


@app.route("/join")
def join():
    return send_from_directory("static", "index.html")


@app.route("/api/create_game", methods=["POST"])
def create_game() -> Response:
    """
    Expects:
    {
       "userId": "1268e47d-c259-4a1e-b5c4-bdeef07dc2ee",
       "gameMode": "guess"
    }

    Returns:
    {
        "gameCode": "A1B2",
        "gameMode": "guess"
    }
    """
    data: dict = json.loads(request.get_data())
    app.logger.info(data)
    if "gameMode" in data:
        game_mode = data["gameMode"]
    else:
        return jsonify({"message": "Missing gameMode field"}), 400

    if "userId" in data:
        host_id = data["userId"]
    else:
        return jsonify({"message": "Missing userId field"}), 400

    code = utils.generate_game_code()
    game_rooms[code] = {
        "players": {},
        "gameMode": game_mode,
        "hostId": host_id,
        "currentRound": -1,
        "rounds": {},  # List of responses with timestamps
    }
    return jsonify({"gameCode": code, "gameMode": game_mode}), 201


@app.route("/api/round_info", methods=["POST"])
def round_info():
    """
    Expects body in form:
    {
        "roundIndex": 0,
        "gameCode": "TBA2",
        "spotifyAccessToken": "accessToken",
        "roundTheme": "80s" // optional, random otherwise
    }
    Returns
    {
        "roundIndex": 0,
        "gameCode": "TBA2",
        "spotifySongUri": "spotify:track:4uLU6hMCjMI75M1A2tKUQC"
        "songTitle": "test"
        "artist": "Bob"
        "roundTheme": "80s"
    }
    """
    data: dict = json.loads(request.get_data())

    round_index = int(data["roundIndex"])
    game_code = data["gameCode"]
    if game_rooms[game_code]["currentRound"] < int(round_index):
        game_rooms[game_code]["currentRound"] = int(round_index)

    if round_index in game_rooms[game_code]["rounds"]:
        round = game_rooms[game_code]["rounds"][round_index]
        return jsonify(
            {
                "spotifySongUri": round["songUri"],
                "gameCode": game_code,
                "roundTheme": round["roundTheme"],
                "roundIndex": round_index,
            }
        ), 200

    access_token = data["spotifyAccessToken"]
    round_theme = ""
    if "roundTheme" in data.keys():
        round_theme = data["roundTheme"]

    if game_code not in game_rooms:
        return jsonify({"message": "Game code not valid"}), 400

    song_uri, song_title, song_artist, round_theme = utils.select_song(round_theme, access_token)

    game_rooms[game_code]["rounds"][round_index] = {
        "songUri": song_uri,
        "buzzIns": [],
        "roundTheme": round_theme,
    }

    return jsonify(
        {
            "roundIndex": round_index,
            "gameCode": game_code,
            "spotifySongUri": song_uri,
            "songTitle": song_title,
            "songArtist": song_artist,
            "roundTheme": round_theme,
        }
    ), 200


@app.route("/api/current_round", methods=["POST"])
def get_current_round():
    """
    gets the current round number, takes the game code in json
    {
        "gameCode": "abcd"
    }

    Returns

    {
        "currentIndex": 2
    }
    """
    data: dict = json.loads(request.get_data())
    game_code = data["game_code"]
    current_index = game_rooms[game_code]["currentRound"]
    return jsonify({"currentIndex": current_index}), 200


@app.route("/api/themes", methods=["GET"])
def get_available_themes() -> Response:
    """
    Returns list of available themes in form:
    {
        "themes": [
            "80s",
            "2010s"
        ]
    }
    """

    themes = utils.get_available_themes()
    return jsonify({"themes": themes}), 200


@app.route("/api/join_game", methods=["POST"])
def join_game():
    """POST: { "gameCode": "abcd", "name": "Alice" }"""
    data: dict = json.loads(request.get_data())
    if "name" not in data:
        return jsonify({"message": "missing name"}), 400
    if "gameCode" not in data:
        return jsonify({"message": "missing gameCode"}), 400

    game_code = data["gameCode"]
    name = data["name"]

    if game_code not in game_rooms:
        return jsonify({"message": "Invalid gameCode"}), 400

    if name in game_rooms[game_code]["players"]:
        return jsonify({"message": "Player with that name already exists"}), 409

    game_rooms[game_code]["players"][name] = 0

    return jsonify({"message": "Player added"}), 201


@app.route("/api/get_players", methods=["POST"])
def get_players():
    data: dict = json.loads(request.get_data())
    if "gameCode" not in data:
        return jsonify({"message": "gameCode missing"}), 400
    game_code = data["gameCode"]
    if game_code not in game_rooms:
        return jsonify({"message": "invalid gameCode"}), 400
    return jsonify(game_rooms[game_code]["players"])


@app.route("/api/get_scoreboard", methods=["POST"])
def get_scoreboard():
    data: dict = json.loads(request.get_data())
    if "gameCode" not in data:
        return jsonify({"message": "gameCode missing"}), 400
    game_code = data["gameCode"]
    if game_code not in game_rooms:
        return jsonify({"message": "invalid gameCode"}), 400
    players = game_rooms[game_code]["players"]
    playersList = [
        {"name": name, "score": score}
        for _, (name, score) in enumerate(players.items())
    ]
    playersList.sort(key=lambda player: player["score"])
    return jsonify({"winner": playersList[0], "scoreboard": playersList})


@app.route("/api/buzz_in", methods=["POST"])
def buzz_in():
    """User gives user name and game code along with any other data
    Records timestamp in global state
    IN:
    {
        "playerName": "Alice",
        "gameCode": "abcd"
        "roundIndex": 1
    }
    """
    data: dict = json.loads(request.get_data())

    name = data["playerName"]
    game_code = data["gameCode"]
    round_index = int(data["roundIndex"])

    game_rooms[game_code]["rounds"][round_index]["buzzIns"].append(
        {"name": name, "timestamp": utils.current_timestamp()}
    )

    return jsonify({"message": "Buzzed in"}), 200


@app.route("/api/next_buzz_in", methods=["POST"])
def next_buzz_in():
    """Returns the first buzz in for the given game code and round index or empty
    expects:
    {
        "gameCode": "abcd",
        "roundIndex": "1"
    }
    """
    data: dict = json.loads(request.get_data())
    game_code = data["gameCode"]
    round_index = int(data["roundIndex"])
    next = data[game_code]["rounds"][round_index]["buzzIns"].pop(0)

    return jsonify(next), 200


@app.route("/api/result", methods=["POST"])
def set_result():
    """Set Winner/Loser
    {
        "gameCode": "abcd"
        "name": "alice",
        "result": "correct" || "incorrect"
    }
    """
    data: dict = json.loads(request.get_data())
    game_code = data["gameCode"]
    name = data["name"]
    result = data["result"]

    if name not in game_rooms[game_code]["players"]:
        return jsonify({"message": "Invalid player name"}), 400

    if result == "correct":
        game_rooms[game_code]["players"][name] += 1000
    else:
        game_rooms[game_code]["players"][name] -= 500


if __name__ == "__main__":
    if os.environ.get("USE_SSL"):
        context = ("/ssl/fullchain.pem", "/ssl/privkey.pem")
        socketio.run(app, host="0.0.0.0", ssl_context=context)
    else:
        socketio.run(app, host="0.0.0.0")
