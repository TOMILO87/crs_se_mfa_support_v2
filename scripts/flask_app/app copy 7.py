from flask import Flask, request, jsonify, render_template
import tensorflow as tf
import pickle
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)

# Paths to the model and tokenizer files
MODEL_PATH = '/var/models/Gender_model.keras'
TOKENIZER_PATH = '/var/models/Gender_tokenizer.pickle'

# Preprocess function
def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

# Lazy loading function for the model and tokenizer
def load_model_and_tokenizer():
    """Load the model and tokenizer dynamically."""
    model = tf.keras.models.load_model(MODEL_PATH)
    with open(TOKENIZER_PATH, 'rb') as f:
        tokenizer = pickle.load(f)
    return model, tokenizer

@app.route('/')
def home():
    return "Welcome! Use /predict_page to access the prediction interface or POST to /api/predict for API usage."

@app.route('/predict_page', methods=["GET", "POST"])
def predict_page():
    if request.method == "POST":
        try:
            # Get description from form
            description = request.form["description"]

            # Load the model and tokenizer dynamically
            model, tokenizer = load_model_and_tokenizer()

            # Preprocess description
            input_data = preprocess_input(description, tokenizer)

            # Make prediction
            prediction = model.predict(input_data)
            predicted_class = prediction.argmax(axis=1)[0]

            # Convert probabilities to a list
            prediction_probabilities = prediction.tolist()[0]

            # Pass data back to the template for rendering
            return render_template(
                "predict_page.html",
                description=description,
                predicted_class=predicted_class,
                prediction_probabilities=prediction_probabilities,
            )
        except Exception as e:
            return render_template("predict_page.html", error=str(e))
    
    # Render an empty form if GET request
    return render_template("predict_page.html")

@app.route('/api/predict', methods=["POST"])
def predict_api():
    try:
        # Get JSON data from the POST request
        data = request.get_json()
        description = data.get("description", "")

        if not description:
            return jsonify({"error": "Description is required"}), 400

        # Load the model and tokenizer dynamically
        model, tokenizer = load_model_and_tokenizer()

        # Preprocess description
        input_data = preprocess_input(description, tokenizer)

        # Make prediction
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]

        # Convert probabilities to a list
        prediction_probabilities = prediction.tolist()[0]

        # Return JSON response
        return jsonify({
            "predicted_class": predicted_class,
            "prediction_probabilities": prediction_probabilities
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
