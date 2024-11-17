from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import pickle
import requests
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

# Tell TensorFlow to ignore any available GPUs and only use the CPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Initialize Flask app
app = Flask(__name__)
CORS(app)

## During development trained models are downloaded from github ##

# Function to download files
def download_file(url, local_path):
    """Downloads a file from a URL and saves it to a local path."""
    response = requests.get(url)
    if response.status_code == 200:
        with open(local_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded {url} to {local_path}")
    else:
        print(f"Error downloading {url} (Status code: {response.status_code})")

# Paths to the model and tokenizer files
MODEL_URL = "https://github.com/TOMILO87/crs_se_mfa_support_v2/blob/eb975ae57e3204f9a87a3be92e4afc10033a4001/models/Gender_model.keras"
TOKENIZER_URL = "https://github.com/TOMILO87/crs_se_mfa_support_v2/blob/eb975ae57e3204f9a87a3be92e4afc10033a4001/models/Gender_tokenizer.pickle"

MODEL_PATH = './models/Gender_model.keras'  # Will be saved in the models folder (ensure this folder exists)
TOKENIZER_PATH = './models/Gender_tokenizer.pickle'

# Create the models directory if it doesn't exist
os.makedirs('./models', exist_ok=True)

# Download files to the Flask app
download_file(MODEL_URL, MODEL_PATH)
download_file(TOKENIZER_URL, TOKENIZER_PATH)

# Load model and tokenizer once when the app starts
model = tf.keras.models.load_model(MODEL_PATH)
with open(TOKENIZER_PATH, 'rb') as f:
    tokenizer = pickle.load(f)

def preprocess_input(description, tokenizer, maxlen=200):
    # Tokenize and pad the input description
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction_result = None
    prediction_probabilities = None
    description = ""

    if request.method == 'POST':
        # Get description from the form
        description = request.form['description']
        
        if description.strip():  # Check if description is not empty
            # Preprocess the description
            input_data = preprocess_input(description, tokenizer)
            
            # Make prediction
            prediction = model.predict(input_data)
            predicted_class = prediction.argmax(axis=1)[0]
            
            # Convert probabilities to a list for easier rendering
            prediction_probabilities = prediction.tolist()
            prediction_result = predicted_class

    return render_template(
        'index.html',
        prediction=prediction_result,
        probabilities=prediction_probabilities,
        description=description
    )

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint for predictions."""
    data = request.json
    description = data.get("description", "")

    if not description.strip():
        return jsonify({"error": "Description cannot be empty"}), 400

    input_data = preprocess_input(description, tokenizer)
    prediction = model.predict(input_data)
    predicted_class = prediction.argmax(axis=1)[0]

    return jsonify({
        "prediction": int(predicted_class),
        "probabilities": prediction.tolist()
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)  # Run on port 5001