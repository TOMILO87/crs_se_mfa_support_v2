from flask import Flask, request, render_template
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle

app = Flask(__name__)

# Paths to model and tokenizer
MODEL_PATH = '/var/models/Gender_model.keras'
TOKENIZER_PATH = '/var/models/Gender_tokenizer.pickle'

# Load model and tokenizer
model = tf.keras.models.load_model(MODEL_PATH)
with open(TOKENIZER_PATH, 'rb') as f:
    tokenizer = pickle.load(f)

def preprocess_input(description, tokenizer, maxlen=200):
    """Tokenize and pad the input description."""
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

@app.route("/", methods=["GET", "POST"])
def index():
    prediction = None
    probabilities = None
    description = ""

    if request.method == "POST":
        description = request.form["description"]
        if description.strip():
            # Preprocess and predict
            input_data = preprocess_input(description, tokenizer)
            prediction_result = model.predict(input_data)
            predicted_class = prediction_result.argmax(axis=1)[0]
            prediction = predicted_class
            probabilities = prediction_result.tolist()

    return render_template("index.html", description=description, prediction=prediction, probabilities=probabilities)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
