import React, { useState } from "react";
import * as tf from "@tensorflow/tfjs";

const ModelTester = () => {
  const [model, setModel] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [prediction, setPrediction] = useState(null);

  // Function to load the model
  const loadModel = async () => {
    try {
      const loadedModel = await tf.loadLayersModel(
        "/model/web_model/model.json"
      ); // Correct path to the model
      setModel(loadedModel);
      console.log("Model loaded successfully!");
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  // Function to make a prediction
  const makePrediction = () => {
    if (!model) {
      alert("Model not loaded. Please load the model first.");
      return;
    }

    // Convert input value to tensor
    const inputTensor = tf.tensor2d([[parseFloat(inputValue)]]);
    const output = model.predict(inputTensor);

    // Get prediction result
    output.data().then((data) => {
      setPrediction(data[0]);
    });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>TensorFlow.js Model Tester</h1>
      <button onClick={loadModel} style={{ marginBottom: "10px" }}>
        Load Model
      </button>
      <br />
      <input
        type="number"
        placeholder="Enter a number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{ padding: "5px", marginRight: "10px" }}
      />
      <button onClick={makePrediction}>Make Prediction</button>
      <br />
      {prediction !== null && (
        <div style={{ marginTop: "20px" }}>
          <h2>Prediction:</h2>
          <p>{prediction}</p>
        </div>
      )}
    </div>
  );
};

export default ModelTester;
