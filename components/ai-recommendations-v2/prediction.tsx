// Prediction.tsx
import React, { useState } from "react";
import * as tf from "@tensorflow/tfjs";

interface PredictionProps {
  model: tf.LayersModel;
  createTextEmbedding: (description: string) => Promise<number[]>;
}

const Prediction: React.FC<PredictionProps> = ({
  model,
  createTextEmbedding,
}) => {
  const [description, setDescription] = useState<string>("");
  const [prediction, setPrediction] = useState<number | null>(null);

  const handlePrediction = async () => {
    const embedding = await createTextEmbedding(description);
    const predictionTensor = model.predict(
      tf.tensor2d([embedding])
    ) as tf.Tensor;
    const predictedClass = predictionTensor.dataSync()[0]; // Assuming binary classification
    setPrediction(predictedClass);
  };

  return (
    <div>
      <h4>Enter Description for Prediction:</h4>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter a course description"
      />
      <button onClick={handlePrediction}>Predict</button>

      {prediction !== null && (
        <p>
          Prediction: {prediction === 1 ? "Class 1" : "Class 0"} (Confidence:{" "}
          {prediction})
        </p>
      )}
    </div>
  );
};

export default Prediction;
