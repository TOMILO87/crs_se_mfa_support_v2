import os
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Tell TensorFlow to ignore any available GPUs and only use the CPU
#os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Paths to the model and tokenizer files
model_path = '/var/models/Gender_model.keras'
tokenizer_path = '/var/models/Gender_tokenizer.pickle'

def load_model_and_tokenizer(model_path, tokenizer_path):
    # Load the trained model
    model = tf.keras.models.load_model(model_path)
    
    # Load the tokenizer
    with open(tokenizer_path, 'rb') as f:
        tokenizer = pickle.load(f)
    
    return model, tokenizer

def preprocess_input(description, tokenizer, maxlen=200):
    # Tokenize and pad the input description
    seq = tokenizer.texts_to_sequences([description])
    padded_seq = pad_sequences(seq, padding='post', maxlen=maxlen)
    return padded_seq

def predict_description(description, model, tokenizer):
    # Preprocess the input description
    input_data = preprocess_input(description, tokenizer)
    
    # Predict using the model
    prediction = model.predict(input_data)
    
    # Return the class probabilities or the predicted class
    predicted_class = prediction.argmax(axis=1)[0]  # Get the index of the highest probability
    return predicted_class, prediction  # Return class index and probabilities for further analysis

# Example usage
if __name__ == "__main__":
    # Load the model and tokenizer
    model, tokenizer = load_model_and_tokenizer(model_path, tokenizer_path)
    
    # Description to predict
    description = "Community network contribution in the field of education in Tanazania."
    
    # Predict
    predicted_class, probabilities = predict_description(description, model, tokenizer)
    
    print(f"Predicted Class: {predicted_class}")
    print(f"Class Probabilities: {probabilities}")
