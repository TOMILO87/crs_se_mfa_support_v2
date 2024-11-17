import { useState } from "react";

const ModelPrediction = () => {
  const [description, setDescription] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ LongDescription: description }),
      });

      const data = await response.json();
      if (response.ok) {
        setPrediction(data.prediction);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error making prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description here"
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Loading..." : "Get Prediction"}
      </button>

      {prediction && <div>Prediction: {prediction}</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
};

export default ModelPrediction;
