from flask import Flask, send_from_directory, request, jsonify
app = Flask(__name__)

@app.route('/')
def home():
    return send_from_directory('static', "index.html")

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route("/api/create_game", methods=['POST'])
def create_game():
    data = request.get_json()

    return jsonify({'message': "Yippee !!!!!"}), 201