from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)
CORS(app)

# Paths to the model and tokenizer files
MODEL_PATH = '/var/models/Gender_model.keras'
TOKENIZER_PATH = '/var/models/Gender_tokenizer.pickle'

# Load the model and tokenizer once during app initialization
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
    with open(TOKENIZER_PATH, 'rb') as f:
        tokenizer = pickle.load(f)
    print("Tokenizer loaded successfully.")
except Exception as e:
    print(f"Error loading model or tokenizer: {e}")
    model = None
    tokenizer = None

# Preprocessing function
def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

@app.route('/')
def index():
    """Main page."""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """Handle predictions."""
    try:
        data = request.json
        description = data.get("description", "").strip()

        if not description:
            return jsonify({"error": "Description cannot be empty"}), 400

        if not model or not tokenizer:
            return jsonify({"error": "Model or tokenizer not loaded."}), 500

        # Preprocess input and make prediction
        input_data = preprocess_input(description, tokenizer)
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]

        return jsonify({
            "description": description,
            "prediction": int(predicted_class),
            "probabilities": prediction.tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    if model and tokenizer:
        return jsonify({"status": "ok"}), 200
    return jsonify({"status": "error", "message": "Model or tokenizer not loaded"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
