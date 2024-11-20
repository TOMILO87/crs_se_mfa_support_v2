from flask import Flask, request, jsonify, g
from flask_cors import CORS  # Import CORS for cross-origin requests
import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Allow all origins; restrict for production if needed

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

@app.route("/")
def home():
    """Basic test endpoint to verify app is running."""
    return "Flask app is running!"

@app.route("/api/predict", methods=["POST"])
def predict_api():
    """API endpoint for making predictions."""
    try:
        # Get JSON data from the POST request
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

        # Return JSON response
        return jsonify({
            "predicted_class": predicted_class,
            "prediction_probabilities": prediction_probabilities
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["GET", "POST"])
def predict_page():
    """Web page for entering a description and viewing predictions."""
    if request.method == "POST":
        try:
            # Get description from form data
            description = request.form.get("description", "")

            if not description:
                return (
                    "<h1>Error: Description is required</h1>"
                    "<a href='/predict'>Go Back</a>"
                )

            # Load model and tokenizer
            model, tokenizer = get_model_and_tokenizer()

            # Preprocess the input description
            input_data = preprocess_input(description, tokenizer)

            # Make prediction
            prediction = model.predict(input_data)
            predicted_class = prediction.argmax(axis=1)[0]
            prediction_probabilities = prediction.tolist()[0]

            # Return prediction results in an HTML format
            return (
                f"<h1>Prediction Results</h1>"
                f"<p><strong>Description:</strong> {description}</p>"
                f"<p><strong>Predicted Class:</strong> {predicted_class}</p>"
                f"<p><strong>Prediction Probabilities:</strong> {prediction_probabilities}</p>"
                f"<a href='/predict'>Go Back</a>"
            )

        except Exception as e:
            return (
                f"<h1>Error: {e}</h1>"
                f"<a href='/predict'>Go Back</a>"
            )
    else:
        # Render a simple form for input
        return (
            "<h1>Enter a Description</h1>"
            "<form method='POST'>"
            "<textarea name='description' rows='5' cols='50' required></textarea><br><br>"
            "<button type='submit'>Predict</button>"
            "</form>"
        )

if __name__ == "__main__":
    # Check if the model files exist
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model file not found at {MODEL_PATH}")
        exit(1)
    if not os.path.exists(TOKENIZER_PATH):
        print(f"Error: Tokenizer file not found at {TOKENIZER_PATH}")
        exit(1)

    app.run(debug=True, host="0.0.0.0")
