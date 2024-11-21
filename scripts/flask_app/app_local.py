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
    "biodiversity": "../../models/biodiversity_model.keras",
    "category": "../../models/category_model.keras",
    "climateadaptation": "../../models/climateadaptation_model.keras",
    "climatemitigation": "../../models/climatemitigation_model.keras",
    "dig": "../../models/dig_model.keras",
    "environment": "../../models/environment_model.keras",
    "gender": "../../models/gender_model.keras",
    "parenttype": "../../models/parenttype_model.keras",
    #"recipientname": "../../models/recipientname_model.keras",
    "rmnch": "../../models/rmnch_model.keras"
}

TOKENIZER_PATHS = {
    "biodiversity": "../../models/biodiversity_tokenizer.pickle",
    "category": "../../models/category_tokenizer.pickle",
    "climateadaptation": "../../models/climateadaptation_tokenizer.pickle",
    "climatemitigation": "../../models/climatemitigation_tokenizer.pickle",
    "dig": "../../models/dig_tokenizer.pickle",
    "environment": "../../models/environment_tokenizer.pickle",
    "gender": "../../models/gender_tokenizer.pickle",
    "parenttype": "../../models/parenttype_tokenizer.pickle",
    # "recipientname": "../../models/recipientname_tokenizer.pickle",
    "rmnch": "../../models/rmnch_tokenizer.pickle"
}

LABEL_ENCODER_PATHS = {
    "biodiversity": "../../models/biodiversity_label_encoder.pickle",
    "category": "../../models/category_label_encoder.pickle",
    "climateadaptation": "../../models/climateadaptation_label_encoder.pickle",
    "climatemitigation": "../../models/climatemitigation_label_encoder.pickle",
    "dig": "../../models/dig_label_encoder.pickle",
    "environment": "../../models/environment_label_encoder.pickle",
    "gender": "../../models/gender_label_encoder.pickle",
    "parenttype": "../../models/parenttype_label_encoder.pickle",
    #"recipientname": "../../models/recipientname_label_encoder.pickle",
    "rmnch": "../../models/rmnch_label_encoder.pickle"
}

# Map models to custom names
CUSTOM_NAMES = {
    "biodiversity": "Biologisk mångfald",
    "category": "Sektor (grupp)",
    "climateadaptation": "Klimatanpassning",
    "climatemitigation": "Utsläppsminskning",
    "dig": "Demokratisk och inkluderande samhällsstyrning",
    "environment": "Miljö",
    "gender": "Jämställdhet",
    "parenttype": "Samarbetsform (grupp)",
    "recipientname": "Mottagarland (låg träffsäkerhet)",
    "rmnch": "Barnhälsa och mödravård"
}

# Preprocess function for text descriptions
def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

# Utility function to load models, tokenizers, and label encoders for selected models
def get_models_and_tokenizers(selected_models):
    """Load and cache only the selected models, tokenizers, and label encoders."""
    if "models" not in g:
        g.models = {}
    if "tokenizers" not in g:
        g.tokenizers = {}
    if "label_encoders" not in g:
        g.label_encoders = {}

    for model_key in selected_models:
        if model_key not in g.models:
            g.models[model_key] = tf.keras.models.load_model(MODEL_PATHS[model_key])
        if model_key not in g.tokenizers:
            with open(TOKENIZER_PATHS[model_key], 'rb') as f:
                g.tokenizers[model_key] = pickle.load(f)
        if model_key not in g.label_encoders:
            with open(LABEL_ENCODER_PATHS[model_key], 'rb') as f:
                g.label_encoders[model_key] = pickle.load(f)

    return (
        {key: g.models[key] for key in selected_models},
        {key: g.tokenizers[key] for key in selected_models},
        {key: g.label_encoders[key] for key in selected_models},
    )

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
        selected_models = data.get("selected_models", [])  # List of selected model keys

        if not description:
            return jsonify({"error": "Description is required"}), 400

        if not selected_models:
            return jsonify({"error": "No models selected"}), 400

        # Load only the selected models, tokenizers, and label encoders
        models, tokenizers, label_encoders = get_models_and_tokenizers(selected_models)

        predictions = {}

        # Predict for each selected model dynamically
        for model_key in selected_models:
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
        selected_models = request.form.getlist("selected_models")  # Get selected models from the form

        if not description:
            return render_template(
                "predict.html",
                error="Description is required",
                model_names=MODEL_PATHS.keys(),
                custom_names=CUSTOM_NAMES,
                selected_models=selected_models,
            )

        # Default to all models if none are selected
        if not selected_models:
            selected_models = list(MODEL_PATHS.keys())

        # Load models, tokenizers, and label encoders for selected models
        models, tokenizers, label_encoders = get_models_and_tokenizers(selected_models)

        predictions = {}

        # Predict for each selected model
        for model_key in selected_models:
            model = models[model_key]
            tokenizer = tokenizers[model_key]
            label_encoder = label_encoders[model_key]
            predictions[model_key] = make_prediction(model, tokenizer, label_encoder, description)

        return render_template(
            "predict.html",
            predictions=predictions,
            model_names=MODEL_PATHS.keys(),
            custom_names=CUSTOM_NAMES,
            selected_models=selected_models,
        )

    # Render the form with all models listed
    return render_template(
        "predict.html",
        model_names=MODEL_PATHS.keys(),
        custom_names=CUSTOM_NAMES,
        selected_models=[],
    )


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

    app.run(debug=True, host="0.0.0.0", port=5001)

