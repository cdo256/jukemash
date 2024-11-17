import json
import os

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
        "players": [],
        "gameMode": game_mode,
        "hostId": host_id,
        "responses": [],  # List of responses with timestamps
        "roundTimestamps": {},  # Stores start and end timestamps for each round
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
        "roundTheme": "80s"
    }
    """
    data: dict = json.loads(request.get_data())

    round_index = data["roundIndex"]
    game_code = data["gameCode"]
    access_token = data["spotifyAccessToken"]
    round_theme = ""
    if "roundTheme" in data.keys():
        round_theme = data["roundTheme"]

    if game_code not in game_rooms:
        return jsonify({"message": "Game code not valid"}), 400

    song_uri, round_theme = utils.select_song(round_theme, access_token)

    return jsonify(
        {
            "roundIndex": round_index,
            "gameCode": game_code,
            "spotifySongUri": song_uri,
            "roundTheme": round_theme,
        }
    ), 200


# WebSocket Event: Chat or Game Logic
@socketio.on("send_message")
def on_send_message(data):
    game_code = data["game_code"]
    message = data["message"]
    emit("new_message", {"message": message}, to=game_code)


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


@socketio.on("round_start")
def round_start(data):
    game_code = data["game_code"]

    if game_code in game_rooms:
        timestamp = utils.current_timestamp()
        game_rooms[game_code]["roundTimestamps"]["start"] = timestamp
        game_mode = game_rooms[game_code]["gameMode"]

        emit(
            "round_start",
            {
                "message": "Round has started!",
                "game_mode": game_mode,
                "timestamp": timestamp,
            },
            to=game_code,
        )
    else:
        emit("error", {"message": "Invalid game code"})


@socketio.on("round_end")
def round_end(data):
    game_code = data["game_code"]

    if game_code in game_rooms:
        timestamp = utils.current_timestamp()
        game_rooms[game_code]["roundTimestamps"]["end"] = timestamp

        emit(
            "round_end",
            {"message": "Round has ended!", "timestamp": timestamp},
            to=game_code,
        )

        # Clear responses after round ends
        game_rooms[game_code]["responses"] = []
    else:
        emit("error", {"message": "Invalid game code"})


@socketio.on("submit_response")
def submit_response(data):
    username = data["username"]
    game_code = data["game_code"]
    response = data["response"]  # Variable JSON depending on the game mode

    if game_code in game_rooms:
        timestamp = utils.current_timestamp()
        game_rooms[game_code]["responses"].append(
            {"username": username, "response": response, "timestamp": timestamp}
        )

        emit(
            "response_received",
            {"username": username, "response": response, "timestamp": timestamp},
            to=game_code,
        )
    else:
        emit("error", {"message": "Invalid game code"})


@socketio.on("join_game")
def on_join_game(data):
    username = data["username"]
    game_code = data["game_code"]

    if game_code in game_rooms:
        join_room(game_code)
        game_rooms[game_code]["players"].append(username)
        emit("player_joined", {"username": username}, to=game_code)
        emit("game_state", {"players": game_rooms[game_code]["players"]}, to=game_code)
    else:
        emit("error", {"message": "Invalid game code"})


# WebSocket Event: Leave Game
@socketio.on("leave_game")
def on_leave_game(data):
    username = data["username"]
    game_code = data["game_code"]

    if game_code in game_rooms:
        leave_room(game_code)
        game_rooms[game_code]["players"].remove(username)
        emit("player_left", {"username": username}, to=game_code)


if __name__ == "__main__":
    if os.environ.get("USE_SSL"):
        context = ("/ssl/fullchain.pem", "/ssl/privkey.pem")
        socketio.run(app, host="0.0.0.0", ssl_context=context)
    else:
        socketio.run(app, host="0.0.0.0")
