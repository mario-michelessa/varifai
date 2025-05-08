from flask import Flask, jsonify, request, redirect
from flask_cors import CORS, cross_origin
from classes import *
import time 

app = Flask(__name__)
# CORS(app)
app.url_map.strict_slashes = False

from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

resources={r"*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]} }
CORS(app, resources=resources, supports_credentials=True)
@app.before_request
def log_request_info():
    print(f"Received request from {request.remote_addr} to {request.url} with method {request.method}")
    print(f"Request body: {request.get_data()}")

    if request.method == "OPTIONS":
        return '', 200  # Respond directly with a 200 OK for preflight
    if "localhost" in request.host:
        print(f"Localhost request - skipped https redirection")
        return  # Skip HTTPS redirection for local development
    if request.headers.get("X-Forwarded-Proto", "http") != "https":
        print(f"REDIRECTED")
        return redirect(request.url.replace('http://', 'https://'), code=301)


@app.route('/')
def index():
    return "Hello, Flask!"

@app.route('/api/generate', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/generate/<int:session_tab>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def generate(session_tab):
    '''generates images corresponding to the main prompt
    input: {"text": "prompt text @ n_ims", distributions: current distributions}
    output: {"text", 
            "data": {
                "images": [b64 encoded images], 
                "prompts": [prompts], 
                "labels": [labels], 
                "metrics": [metrics], 
                "distributions": [distributions with updated y_real]}}'''
    if request.method == 'OPTIONS':
        return '', 200
    
    start = time.time()
    message = request.json
    previous_state_tab = chat.session.duplicate_tab(session_tab)

    prompt, n_ims, distributions = message['text'].split("@")[0], int(message['text'].split("@")[1]), message['distributions']
    chat.session.tabs[session_tab].receive_message({"text": f"{prompt}"})
    chat.session.tabs[session_tab].sync_distributions(distributions)

    print(f"Update Prompt session {chat.session.session_name} tab {session_tab} ...", message)
    
    data = chat.generate(session_tab, prompt, n_ims, use_llm=False)
    message = {'type':'generate',
                'text': "Images Generated: Previous state #"+str(previous_state_tab), 
               'data':  data}
    
    message = chat.session.tabs[session_tab].send_message(message)
    # print(f"Message sent: {message}")
    chat.session.save_data()
    
    end = time.time() - start
    print(f"Time taken: {end} - Number of images: {n_ims}")
    return jsonify(message), 200

@app.route('/api/change-distribution-x', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/change-distribution-x/<int:session_tab>', methods=['PUT', 'OPTIONS'])
def change_distribution(session_tab):
    '''
    input: {"dimension": "dimension name", "newX": [x values], "y_target": [y values]}'''
    if request.method == 'OPTIONS': return '', 200

    data = request.json
    dimension, x, y_target = data['dimension'], data['newX'], data['yTarget']
    print(f"Change distribution session {chat.session.session_name} tab {session_tab}: {dimension, x, y_target}")    
    
    data = chat.measure(session_tab, dimension, x, y_target)
    message = {'type':'measure', 'text': "Scale updated", 'data':  data}
    message = chat.session.tabs[session_tab].send_message(message)
    print(f"Message sent: {message}")

    chat.session.save_data()
    return jsonify(message), 200

@app.route('/api/suggest-attributes', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/suggest-attributes/<int:session_tab>', methods=['PUT', 'OPTIONS'])
def suggest_attributes(session_tab):
    if request.method == 'OPTIONS': return '', 200

    data = request.json
    print(f"Suggest attributes for prompt {chat.session.session_name} ")    
    
    data = chat.suggest_attributes(0)
    message = {'type':'message', 'text': ', '.join(data), 'data':  {}}

    return jsonify(message), 200

@app.route('/api/add-distribution', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/add-distribution/<int:session_tab>', methods=['PUT', 'OPTIONS'])
def add_distribution(session_tab):
    if request.method == 'OPTIONS': return '', 200

    data = request.json
    dimension = data['dimension']
    print(f"Add distribution session {chat.session.session_name} tab {session_tab}: {dimension}")    
    data = chat.measure(session_tab, dimension, x=None, y_target=None)
    message = {'type':'measure', 'text': "Distribution Added", 'data':  data}
    message = chat.session.tabs[session_tab].send_message(message)
    print(f"Message sent: {message}")

    chat.session.save_data()
    return jsonify(message), 200

@app.route('/api/remove-distribution', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/remove-distribution/<int:session_tab>', methods=['PUT', 'OPTIONS'])
def remove_distribution(session_tab):
    if request.method == 'OPTIONS': return '', 200

    data = request.json
    dimension = data['dimension']
    print(f"Remove distribution session {chat.session.session_name} tab {session_tab}: {dimension}")    
    
    chat.session.tabs[session_tab].remove_distribution(dimension)
    message = {'type':'message', 'text': "Distribution removed"}
    message = chat.session.tabs[session_tab].send_message(message)
    print(f"Message sent: {message}")

    chat.session.save_data()
    return jsonify(message), 200

@app.route('/api/reset-tab', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/reset-tab/<int:session_tab>', methods=['PUT', 'OPTIONS'])
def reset_tab(session_tab):
    if request.method == 'OPTIONS': return '', 200  # Handle OPTIONS requests explicitly if necessary
    
    print(f"Resetting session {chat.session.session_name} ...")
    chat.session.reset_tab(session_tab)
    return jsonify({"text": "Interface reset."}), 200

@app.route('/api/save', methods=['PUT', 'OPTIONS'])
def save_interface():
    if request.method == 'OPTIONS': return '', 200
    chat.session.save_data()
    return jsonify({'type':'message', "text": "Session saved."}), 200

@app.route('/api/load', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/load/<int:session_tab>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def load_interface(session_tab):
    if request.method == 'OPTIONS': return '', 200

    message = request.json
    session_name = message['sessionName']
    chat.session = Session(session_name)
    if session_tab >= len(chat.session.tabs):
        chat.session.tabs.append(Tab(session_tab))
    data, messages = chat.session.tabs[session_tab].return_messages()
    return jsonify({'lastDataset':data, 'messages':messages}), 200

@app.route('/api/change-tab/', defaults={'session_tab': 0}, methods=['PUT', 'OPTIONS'])
@app.route('/api/change-tab/<int:session_tab>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def change_tab(session_tab):
    if request.method == 'OPTIONS': return '', 200

    # session_name = request.json['sessionName']
    # if session_name != chat.session.session_name:
    #     chat.session = Session(session_name)

    if session_tab >= len(chat.session.tabs):
        return jsonify({'type':'message', "text": "Tab does not exist."}), 200
    
    data, messages = chat.session.tabs[session_tab].return_messages()
    return jsonify({'lastDataset':data, 'messages':messages}), 200

if __name__ == '__main__':

    print("Starting chat...")

    chat = Chat()
    print("Chat started.")

    app.run(host='0.0.0.0', port=5000, debug=True)  


