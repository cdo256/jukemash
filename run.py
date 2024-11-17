import os
import json

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room

import utils

game_rooms = {}
app = Flask(__name__)
socketio = SocketIO(app)


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
        "gameCode": "A1B2"
    }
    """
    data: dict = json.loads(request.get_json())
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
    pass


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


if __name__ == "__main__":
    if os.environ['USE_SSL']:
        context = ('/ssl/fullchain.pem', '/ssl/privkey.pem')
        socketio.run(app, host='0.0.0.0', ssl_context=context)
    else:
        socketio.run(app, host="0.0.0.0")
