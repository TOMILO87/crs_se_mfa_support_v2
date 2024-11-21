from flask import Flask, request, jsonify, g, render_template
from flask_cors import CORS
import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os
import numpy as np

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Paths to the model and tokenizer files (Add more models here as needed)
MODEL_PATHS = {
    "biodiversity": "/var/models/biodiversity_model.keras",
    "category": "/var/models/category_model.keras",
    "climateadaptation": "/var/models/climateadaptation_model.keras",
    "climatemitigation": "/var/models/climatemitigation_model.keras",
    "dig": "/var/models/dig_model.keras",
    "environment": "/var/models/environment_model.keras",
    "gender": "/var/models/gender_model.keras",
    "parenttype": "/var/models/parenttype_model.keras",
    "recipientname": "/var/models/recipientname_model.keras",
    "rmnch": "/var/models/rmnch_model.keras"
}

TOKENIZER_PATHS = {
    "biodiversity": "/var/models/biodiversity_tokenizer.pickle",
    "category": "/var/models/category_tokenizer.pickle",
    "climateadaptation": "/var/models/climateadaptation_tokenizer.pickle",
    "climatemitigation": "/var/models/climatemitigation_tokenizer.pickle",
    "dig": "/var/models/dig_tokenizer.pickle",
    "environment": "/var/models/environment_tokenizer.pickle",
    "gender": "/var/models/gender_tokenizer.pickle",
    "parenttype": "/var/models/parenttype_tokenizer.pickle",
    "recipientname": "/var/models/recipientname_tokenizer.pickle",
    "rmnch": "/var/models/rmnch_tokenizer.pickle"
}

LABEL_ENCODER_PATHS = {
    "biodiversity": "/var/models/biodiversity_label_encoder.pickle",
    "category": "/var/models/category_label_encoder.pickle",
    "climateadaptation": "/var/models/climateadaptation_label_encoder.pickle",
    "climatemitigation": "/var/models/climatemitigation_label_encoder.pickle",
    "dig": "/var/models/dig_label_encoder.pickle",
    "environment": "/var/models/environment_label_encoder.pickle",
    "gender": "/var/models/gender_label_encoder.pickle",
    "parenttype": "/var/models/parenttype_label_encoder.pickle",
    "recipientname": "/var/models/recipientname_label_encoder.pickle",
    "rmnch": "/var/models/rmnch_label_encoder.pickle"
}

# Preprocess function for text descriptions
def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

# Utility function to load models, tokenizers, and label encoders
def get_models_and_tokenizers():
    """Load and cache the models, tokenizers, and label encoders in Flask's application context."""
    if "models" not in g:
        g.models = {}
        for model_key, model_path in MODEL_PATHS.items():
            g.models[model_key] = tf.keras.models.load_model(model_path)

    if "tokenizers" not in g:
        g.tokenizers = {}
        for key, path in TOKENIZER_PATHS.items():
            with open(path, 'rb') as f:
                g.tokenizers[key] = pickle.load(f)

    if "label_encoders" not in g:
        g.label_encoders = {}
        for key, path in LABEL_ENCODER_PATHS.items():
            with open(path, 'rb') as f:
                g.label_encoders[key] = pickle.load(f)
    
    return g.models, g.tokenizers, g.label_encoders

@app.teardown_appcontext
def cleanup(exception=None):
    """Clean up resources on application context teardown."""
    g.pop("models", None)
    g.pop("tokenizers", None)
    g.pop("label_encoders", None)

# Helper function for making predictions
def make_prediction(model, tokenizer, label_encoder, description):
    """Make prediction for a given model and tokenizer."""
    input_data = preprocess_input(description, tokenizer)
    prediction = model.predict(input_data)
    pred_class = prediction.argmax(axis=1)[0]
    pred_label = label_encoder.classes_[pred_class]

    # Convert float labels to integers if possible
    if isinstance(pred_label, float) and pred_label.is_integer():
        pred_label = int(pred_label)

    # Map probabilities to their labels
    label_probabilities = [
        (label if not (isinstance(label, float) and label.is_integer()) else int(label), prob)
        for label, prob in zip(label_encoder.classes_, prediction[0])
    ]
    label_probabilities = sorted(label_probabilities, key=lambda x: x[1], reverse=True)

    return {
        "predicted_class": int(pred_class),  # Convert to int for JSON serialization
        "prediction_probabilities": label_probabilities,  # Pair labels with probabilities
        "label": pred_label
    }


@app.route("/api/predict", methods=["POST"])
def predict_api():
    """API endpoint for making predictions."""
    try:
        data = request.get_json()
        description = data.get("description", "")

        if not description:
            return jsonify({"error": "Description is required"}), 400

        # Load models, tokenizers, and label encoders
        models, tokenizers, label_encoders = get_models_and_tokenizers()

        predictions = {}

        # Predict for each model dynamically
        for model_key in models:
            model = models[model_key]
            tokenizer = tokenizers[model_key]
            label_encoder = label_encoders[model_key]
            predictions[model_key] = make_prediction(model, tokenizer, label_encoder, description)

        return jsonify(predictions)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["GET", "POST"])
def predict_page():
    """Prediction page for inputting a description and getting a prediction."""
    if request.method == "POST":
        description = request.form.get("description", "")

        if not description:
            return render_template("predict.html", error="Description is required")

        # Load models, tokenizers, and label encoders
        models, tokenizers, label_encoders = get_models_and_tokenizers()

        predictions = {}

        # Predict for each model dynamically
        for model_key in models:
            model = models[model_key]
            tokenizer = tokenizers[model_key]
            label_encoder = label_encoders[model_key]
            predictions[model_key] = make_prediction(model, tokenizer, label_encoder, description)

        print("Description:", description)

        return render_template("predict.html", predictions=predictions)

    return render_template("predict.html")

@app.route("/")
def home():
    """Basic test endpoint to verify app is running."""
    return "Flask app is running!"

if __name__ == "__main__":
    if not all(os.path.exists(path) for path in MODEL_PATHS.values()):
        print(f"Error: One or more model files are missing.")
        exit(1)
    if not all(os.path.exists(path) for path in TOKENIZER_PATHS.values()):
        print(f"Error: One or more tokenizer files are missing.")
        exit(1)

    app.run(debug=True, host="0.0.0.0")
