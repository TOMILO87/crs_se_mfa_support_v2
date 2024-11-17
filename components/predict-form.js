import { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";

const PredictForm = () => {
  const [inputText, setInputText] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [model, setModel] = useState(null);

  // Load the model once on component mount
  const loadModel = async () => {
    const loadedModel = await tf.loadLayersModel("/tfjs_model/model.json");
    setModel(loadedModel);
  };

  // Tokenizer (example, needs to be replaced with your actual tokenizer)
  const tokenizer = {
    textsToSequences: (texts) => {
      // Placeholder function, replicate your tokenizer logic here
      return texts.map((text) => {
        return text.split(" ").map((word) => word.charCodeAt(0)); // Simple char encoding example
      });
    },
  };

  // Call the model to make predictions
  const predict = async () => {
    if (model) {
      // Preprocess the input text (same as during training)
      const inputSeq = tokenizer.textsToSequences([inputText]); // Use the same tokenizer used during training
      const inputPad = tf.tensor(inputSeq); // Convert to TensorFlow tensor

      // Ensure the tensor shape matches the expected input shape (e.g., batch size, sequence length)
      const inputReshaped = inputPad.expandDims(0); // Adjust shape if needed, e.g., [1, seq_length]

      // Make prediction
      const result = await model.predict(inputReshaped).array();

      // Process the result and set the prediction
      setPrediction(result);
    }
  };

  // Load the model when the component mounts
  useEffect(() => {
    loadModel();
  }, []);

  return (
    <div>
      <h2>Text Prediction</h2>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to predict..."
      ></textarea>
      <button onClick={predict}>Predict</button>

      {prediction && (
        <div>
          <h3>Prediction Result</h3>
          <pre>{JSON.stringify(prediction, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PredictForm;
