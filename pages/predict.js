import { useState } from "react";

export default function Predict() {
  const [description, setDescription] = useState("");
  const [predictions, setPredictions] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send the description to the Next.js API route
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data); // Store the predictions response
      } else {
        console.error("Failed to fetch prediction");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const renderTopPredictions = (predictedClass, probabilities) => {
    // Sort probabilities and get the top 3
    const sortedProbabilities = probabilities
      .map((prob, index) => ({ classIndex: index, probability: prob }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);

    return (
      <div>
        {sortedProbabilities.map(({ classIndex, probability }) => {
          const percentage = (probability * 100).toFixed(2);
          return (
            <div key={classIndex}>
              <strong>Class {classIndex}:</strong> {percentage}%
            </div>
          );
        })}
      </div>
    );
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

      {predictions && (
        <div>
          <h2>Predictions:</h2>
          {Object.keys(predictions).map((model) => (
            <div key={model}>
              <h3>
                {model.charAt(0).toUpperCase() + model.slice(1)} Prediction
              </h3>
              <div>
                <strong>Predicted Class:</strong> {predictions[model].label}
              </div>
              <h4>Top Predictions:</h4>
              {renderTopPredictions(
                predictions[model].predicted_class,
                predictions[model].prediction_probabilities
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
