from flask import Flask, request, jsonify, g, render_template
from flask_cors import CORS
import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Paths to the model and tokenizer files
MODEL_PATH = '/var/models/Gender_model.keras'
TOKENIZER_PATH = '/var/models/Gender_tokenizer.pickle'

# Preprocess function
def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

# Utility function to load the model and tokenizer
def get_model_and_tokenizer():
    """Load and cache the model and tokenizer in Flask's application context."""
    if "model" not in g:
        g.model = tf.keras.models.load_model(MODEL_PATH)
    if "tokenizer" not in g:
        with open(TOKENIZER_PATH, 'rb') as f:
            g.tokenizer = pickle.load(f)
    return g.model, g.tokenizer

@app.teardown_appcontext
def cleanup(exception=None):
    """Clean up resources on application context teardown."""
    g.pop("model", None)
    g.pop("tokenizer", None)

@app.route("/api/predict", methods=["POST"])
def predict_api():
    """API endpoint for making predictions."""
    try:
        data = request.get_json()
        description = data.get("description", "")

        if not description:
            return jsonify({"error": "Description is required"}), 400

        # Load model and tokenizer
        model, tokenizer = get_model_and_tokenizer()

        # Preprocess the input description
        input_data = preprocess_input(description, tokenizer)

        # Make prediction
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]
        prediction_probabilities = prediction.tolist()[0]

        return jsonify({
            "predicted_class": predicted_class,
            "prediction_probabilities": prediction_probabilities
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["GET", "POST"])
def predict_page():
    """Prediction page for inputting a description and getting a prediction."""
    if request.method == "POST":
        description = request.form.get("description", "")

        if not description:
            return render_template("predict.html", error="Description is required")

        # Load model and tokenizer
        model, tokenizer = get_model_and_tokenizer()

        # Preprocess the input description
        input_data = preprocess_input(description, tokenizer)

        # Make prediction
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]
        prediction_probabilities = prediction.tolist()[0]

        return render_template("predict.html", predicted_class=predicted_class, prediction_probabilities=prediction_probabilities)

    return render_template("predict.html")

@app.route("/")
def home():
    """Basic test endpoint to verify app is running."""
    return "Flask app is running!"

if __name__ == "__main__":
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        exit(1)
    if not os.path.exists(TOKENIZER_PATH):
        print(f"Error: Tokenizer file not found at {TOKENIZER_PATH}")
        exit(1)

    app.run(debug=True, host="0.0.0.0")
