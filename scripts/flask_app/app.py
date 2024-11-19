from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

# Tell TensorFlow to ignore any available GPUs and only use the CPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Paths to the model and tokenizer files on the persistent disk
MODEL_PATH = '/var/models/Gender_model.keras'
TOKENIZER_PATH = '/var/models/Gender_tokenizer.pickle'

# Initialize placeholders for the model and tokenizer
model = None
tokenizer = None

# Try to load the model and tokenizer, handle missing files gracefully
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(TOKENIZER_PATH):
        print("Loading model and tokenizer...")
        model = tf.keras.models.load_model(MODEL_PATH)
        with open(TOKENIZER_PATH, 'rb') as f:
            tokenizer = pickle.load(f)
        print("Model and tokenizer loaded successfully.")
    else:
        print("Model or tokenizer not found. App will start without them.")
except Exception as e:
    print(f"Error loading model or tokenizer: {e}")

def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

@app.route('/', methods=['GET', 'POST'])
def index():
    """Main page with form submission for predictions."""
    prediction_result = None
    description = ""

    if request.method == 'POST':
        # Retrieve the description from the form
        description = request.form.get('description', '').strip()
        print(f"Received description: {description}")  # Debugging output

        # Perform prediction if model and tokenizer are available
        if description and model and tokenizer:
            try:
                input_data = preprocess_input(description, tokenizer)
                prediction = model.predict(input_data)
                predicted_class = prediction.argmax(axis=1)[0]
                prediction_result = predicted_class
                print(f"Prediction result: {prediction_result}")  # Debugging output
            except Exception as e:
                print(f"Error during prediction: {e}")
                prediction_result = "Prediction error."
        else:
            if not model or not tokenizer:
                print("Model or tokenizer not available.")  # Debugging output
            if not description:
                print("Description is missing.")  # Debugging output
            prediction_result = "Model not available or description missing."

    # Render the index page with the results
    return render_template(
        'index.html',
        prediction=prediction_result,
        description=description
    )

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint for predictions."""
    try:
        # Get the JSON payload
        data = request.json
        description = data.get("description", "").strip()

        if not description:
            return jsonify({"error": "Description cannot be empty"}), 400

        if not model or not tokenizer:
            return jsonify({"error": "Model or tokenizer not loaded."}), 500

        # Process the input and make a prediction
        input_data = preprocess_input(description, tokenizer)
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]

        return jsonify({
            "prediction": int(predicted_class),
            "probabilities": prediction.tolist()
        })
    except Exception as e:
        print(f"Error in /api/predict: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 10000)), debug=True)
