import { useState } from "react";

export default function Predict() {
  const [description, setDescription] = useState("");
  const [predictedClass, setPredictedClass] = useState(null);
  const [probabilities, setProbabilities] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();
        setPredictedClass(data.predicted_class); // Update key to match Flask response
        setProbabilities(data.prediction_probabilities); // Update key to match Flask response
      } else {
        console.error("Failed to fetch prediction");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>Predict Target Class</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="5"
          cols="50"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description"
          required
        />
        <br />
        <button type="submit">Predict</button>
      </form>

      {predictedClass !== null && (
        <div>
          <h2>Predicted Class: {predictedClass}</h2>
          {probabilities && (
            <p>Prediction Probabilities: {JSON.stringify(probabilities)}</p>
          )}
        </div>
      )}
    </div>
  );
}
