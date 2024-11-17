import pickle
import tensorflow as tf
from tensorflow import keras
import pandas as pd
from sklearn.model_selection import train_test_split
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.regularizers import l2

# Load data
data = pd.read_csv('../data/CRS_combined_data.csv')

def preprocess_data(target_column, tokenizer=None):
    # Drop rows with missing values in 'LongDescription' or the target column
    data_filtered = data.dropna(subset=['LongDescription', target_column])
    
    # Prepare input (X) and target (y) variables
    X = data_filtered['LongDescription'].values

    # Tokenize and pad the descriptions if tokenizer is not provided
    if tokenizer is None:
        tokenizer = Tokenizer(num_words=10000)
        tokenizer.fit_on_texts(X)
    
    X_seq = tokenizer.texts_to_sequences(X)
    X_pad = pad_sequences(X_seq, padding='post', maxlen=200)  # Adjust maxlen based on your data

    # Prepare the target variable
    y = data_filtered[target_column].values

    return X_pad, y, tokenizer, data_filtered

def train_model(target_column):
    # Preprocess data and optionally create a tokenizer
    X, y, tokenizer, data_filtered = preprocess_data(target_column)

    # Get the number of unique classes in the target column
    num_classes = len(data_filtered[target_column].dropna().unique())

    # Split data into train and test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

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
    model.save(f'../public/models/{target_column}_model.keras')
    with open(f'../public/models/{target_column}_tokenizer.pickle', 'wb') as f:
        pickle.dump(tokenizer, f)

# Main entry point
if __name__ == "__main__":
    target_column = 'Gender'  # Change this value to 'Environment' or 'Category' as needed
    train_model(target_column)
