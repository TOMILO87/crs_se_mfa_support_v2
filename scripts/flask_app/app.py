from flask import Flask, request
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


# Load model
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully.")

# Load tokenizer
with open(TOKENIZER_PATH, 'rb') as f:
    tokenizer = pickle.load(f)
print("Tokenizer loaded successfully.")

@app.route('/')
def test():
    try:
        # Hardcoded description
        description = "Community network contribution in the field of education in Tanzania."

        # Preprocess description
        input_data = preprocess_input(description, tokenizer)

        # Make prediction
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]
        print(f"Predicted Class: {predicted_class}")
        print(f"Prediction Probabilities: {prediction.tolist()}")

        # Return results
        return (
            f"Model and tokenizer loaded successfully!<br>"
            f"Description: {description}<br>"
            f"Predicted Class: {predicted_class}<br>"
            f"Prediction Probabilities: {prediction.tolist()}"
        )
    except Exception as e:
        return f"Error: {e}"

@app.route('/api/predict', methods=["POST"])
def predict():

    print("cat0")
    data = request.get_json()
    description = data["description"]

    print(data, description)
    
    try:
        # Get description
        print("cat1")
        data = request.get_json()
        description = data["description"]

        print(data, description)

        # Preprocess description
        input_data = preprocess_input(description, tokenizer)

        # Make prediction
        prediction = model.predict(input_data)
        predicted_class = prediction.argmax(axis=1)[0]
        print(f"Predicted Class: {predicted_class}")
        print(f"Prediction Probabilities: {prediction.tolist()}")

        # Return results
        return (
            f"Description: {description}<br>"
            f"Predicted Class: {predicted_class}<br>"
            f"Prediction Probabilities: {prediction.tolist()}"
        )
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    app.run(debug=True)
