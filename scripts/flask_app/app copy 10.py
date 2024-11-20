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

# Paths to the model and tokenizer files
MODEL_PATHS = {
    "gender": "/var/models/Gender_model.keras",
    "category": "/var/models/Category_model.keras",
    "environment": "/var/models/Environment_model.keras"
}

TOKENIZER_PATHS = {
    "gender": "/var/models/Gender_tokenizer.pickle",
    "category": "/var/models/Category_tokenizer.pickle",
    "environment": "/var/models/Environment_tokenizer.pickle"
}

LABEL_ENCODER_PATHS = {
    "gender": "/var/models/Gender_label_encoder.pickle",
    "category": "/var/models/Category_label_encoder.pickle",
    "environment": "/var/models/Environment_label_encoder.pickle"
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

        # Predict with Gender model
        gender_model = models["gender"]
        gender_tokenizer = tokenizers["gender"]
        input_data = preprocess_input(description, gender_tokenizer)
        gender_prediction = gender_model.predict(input_data)
        gender_pred_class = gender_prediction.argmax(axis=1)[0]
        predictions["gender"] = {
            "predicted_class": gender_pred_class,
            "prediction_probabilities": gender_prediction.tolist()[0]
        }

        # Predict with Category model
        category_model = models["category"]
        category_tokenizer = tokenizers["category"]
        input_data = preprocess_input(description, category_tokenizer)
        category_prediction = category_model.predict(input_data)
        category_pred_class = category_prediction.argmax(axis=1)[0]
        predictions["category"] = {
            "predicted_class": category_pred_class,
            "prediction_probabilities": category_prediction.tolist()[0],
            "category_label": label_encoders["category"].classes_[category_pred_class]
        }

        # Predict with Environment model
        environment_model = models["environment"]
        environment_tokenizer = tokenizers["environment"]
        input_data = preprocess_input(description, environment_tokenizer)
        environment_prediction = environment_model.predict(input_data)
        environment_pred_class = environment_prediction.argmax(axis=1)[0]
        predictions["environment"] = {
            "predicted_class": environment_pred_class,
            "prediction_probabilities": environment_prediction.tolist()[0],
            "environment_label": label_encoders["environment"].classes_[environment_pred_class]
        }

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

        # Predict with Gender model
        gender_model = models["gender"]
        gender_tokenizer = tokenizers["gender"]
        input_data = preprocess_input(description, gender_tokenizer)
        gender_prediction = gender_model.predict(input_data)
        gender_pred_class = gender_prediction.argmax(axis=1)[0]
        predictions["gender"] = {
            "predicted_class": gender_pred_class,
            "prediction_probabilities": gender_prediction.tolist()[0]
        }

        # Predict with Category model
        category_model = models["category"]
        category_tokenizer = tokenizers["category"]
        input_data = preprocess_input(description, category_tokenizer)
        category_prediction = category_model.predict(input_data)
        category_pred_class = category_prediction.argmax(axis=1)[0]
        predictions["category"] = {
            "predicted_class": category_pred_class,
            "prediction_probabilities": category_prediction.tolist()[0],
            "category_label": label_encoders["category"].classes_[category_pred_class]
        }

        # Predict with Environment model
        environment_model = models["environment"]
        environment_tokenizer = tokenizers["environment"]
        input_data = preprocess_input(description, environment_tokenizer)
        environment_prediction = environment_model.predict(input_data)
        environment_pred_class = environment_prediction.argmax(axis=1)[0]
        predictions["environment"] = {
            "predicted_class": environment_pred_class,
            "prediction_probabilities": environment_prediction.tolist()[0],
            "environment_label": label_encoders["environment"].classes_[environment_pred_class]
        }

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
