import pickle
import tensorflow as tf
from tensorflow import keras
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.regularizers import l2

# Load data
data = pd.read_csv('../data/CRS_combined_data.csv')

def preprocess_data(target_column, tokenizer=None):
    """
    Preprocesses data for training.
    - Tokenizes and pads text in the 'combineddescription' column.
    - Encodes the target column using LabelEncoder.

    Args:
        target_column (str): The name of the target column to predict.
        tokenizer (Tokenizer, optional): Pretrained tokenizer (if available).

    Returns:
        X_pad: Padded sequences for input data.
        y: Encoded labels for the target column.
        tokenizer: Trained tokenizer.
        label_encoder: Trained LabelEncoder for decoding labels.
        data_filtered: Filtered DataFrame used for training.
    """
    # Drop rows with missing values in 'combineddescription' or the target column
    data_filtered = data.dropna(subset=['combineddescription', target_column])
    
    # Prepare input (X) and target (y) variables
    X = data_filtered['combineddescription'].values

    # Tokenize and pad the descriptions if tokenizer is not provided
    if tokenizer is None:
        tokenizer = Tokenizer(num_words=10000)
        tokenizer.fit_on_texts(X)
    
    X_seq = tokenizer.texts_to_sequences(X)
    X_pad = pad_sequences(X_seq, padding='post', maxlen=200)  # Adjust maxlen based on your data

    # Encode the target variable
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(data_filtered[target_column].values)

    return X_pad, y, tokenizer, label_encoder, data_filtered

def train_model(target_column):
    """
    Trains a TensorFlow model to predict the given target column.
    - Saves the trained model, tokenizer, and label encoder for future use.

    Args:
        target_column (str): The name of the target column to predict.
    """
    # Preprocess data and optionally create a tokenizer
    X, y, tokenizer, label_encoder, data_filtered = preprocess_data(target_column)

    # Get the number of unique classes in the target column
    num_classes = len(label_encoder.classes_)

    # Split data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.10) # since large data use 0.10 instead of suggested 0.20

    # Define the model
    input_layer = keras.layers.Input(shape=(200,))
    embedding_layer = keras.layers.Embedding(input_dim=10000, output_dim=128)(input_layer)
    x = keras.layers.GlobalAveragePooling1D()(embedding_layer)
    x = keras.layers.Dense(64, activation='relu', kernel_regularizer=l2(0.01))(x)  # L2 Regularization
    x = keras.layers.Dropout(0.5)(x)  # Dropout layer with 50% probability

    # Dynamic output layer based on the number of unique classes
    output_layer = keras.layers.Dense(num_classes, activation='softmax')(x)

    model = keras.Model(inputs=input_layer, outputs=output_layer)

    # Compile the model
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

    # EarlyStopping to prevent overfitting
    early_stopping = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)

    # Train the model
    model.fit(X_train, y_train, epochs=5, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stopping])

    # Save the trained model and tokenizer
    model.save(f'../models/{target_column}_model.keras')
    with open(f'../models/{target_column}_tokenizer.pickle', 'wb') as f:
        pickle.dump(tokenizer, f)
    with open(f'../models/{target_column}_label_encoder.pickle', 'wb') as f:
        pickle.dump(label_encoder, f)

    print(f"Model and tokenizer for {target_column} saved successfully!")

# Main entry point
if __name__ == "__main__":
    target_column = 'gender'  # Change this to 'environment', 'gender', or other target columns as needed
    train_model(target_column)