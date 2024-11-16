from flask import Flask, send_from_directory, request, jsonify
import sqids
import utils

games = {}
app = Flask(__name__)

@app.route('/')
def home():
    return send_from_directory('static', "index.html")

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route("/api/create_game", methods=['POST'])
def create_game():
    """
    \{
       "userId": "1268e47d-c259-4a1e-b5c4-bdeef07dc2ee"
       "gameMode": "guess"
    \}

    returns a game code which is all upper case in the form:
    \{
        "gameCode": A1B2
    \}
    """
    
    data = request.get_json()
    code = utils.generate_game_code()
    return jsonify({'gameCode': code}), 201
    
