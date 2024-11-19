from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

# Set TensorFlow to use only CPU and limit memory usage
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Disable GPU if not needed

# Limit TensorFlow memory usage (only for GPU, skip for CPU)
physical_devices = tf.config.experimental.list_physical_devices('GPU')
if physical_devices:
    try:
        # Limit TensorFlow to a fraction of GPU memory if GPU is available
        tf.config.experimental.set_memory_growth(physical_devices[0], True)
        print("GPU memory growth set successfully.")
    except:
        pass  # Ignore if no GPU is available
else:
    print("No GPU found, proceeding without memory limits.")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Paths to the model and tokenizer files on the persistent disk
MODEL_PATH = '/var/models/Gender_model.keras'
TOKENIZER_PATH = '/var/models/Gender_tokenizer.pickle'

# Initialize placeholders for the model and tokenizer
model = None
tokenizer = None

def load_model_and_tokenizer():
    global model, tokenizer
    """Load the model and tokenizer once when the app starts."""
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(TOKENIZER_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            with open(TOKENIZER_PATH, 'rb') as f:
                tokenizer = pickle.load(f)
            print("Model and tokenizer loaded successfully.")
        else:
            print("Model or tokenizer not found. App will start without them.")
    except Exception as e:
        print(f"Error loading model or tokenizer: {e}")

# Load the model and tokenizer once when the app starts
load_model_and_tokenizer()

def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

@app.route('/', methods=['GET', 'POST'])
def index():
    """Main page with form submission for predictions."""
    prediction_result = None
    prediction_probabilities = None
    description = ""

    if request.method == 'POST':
        description = request.form['description']
        
        if description.strip() and model and tokenizer:
            input_data = preprocess_input(description, tokenizer)
            prediction = model.predict(input_data)
            predicted_class = prediction.argmax(axis=1)[0]
            prediction_probabilities = prediction.tolist()
            prediction_result = predicted_class
        else:
            prediction_result = "Model not available or description missing."

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

    if not model or not tokenizer:
        return jsonify({"error": "Model or tokenizer not loaded."}), 500

    input_data = preprocess_input(description, tokenizer)
    prediction = model.predict(input_data)
    predicted_class = prediction.argmax(axis=1)[0]

    return jsonify({
        "prediction": int(predicted_class),
        "probabilities": prediction.tolist()
    })

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check to confirm service is running."""
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    # Use Gunicorn for production deployment
    app.run(host="0.0.0.0", port=5001, debug=False)  # Set debug=False for production
