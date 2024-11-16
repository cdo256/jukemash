from flask import Flask, send_from_directory

def create_app():
    app = Flask(__name__)

    @app.route('/')
    def home():
        return send_from_directory('static', 'index.html')

    @app.route('/static/<path:filename>')
    def static_files(filename):
        return send_from_directory('static', filename)

    return app
