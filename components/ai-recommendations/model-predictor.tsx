// ModelPredictor.tsx
import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import FieldSelector from "./field-selector";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";

export default function ModelPredictor() {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [inputText, setInputText] = useState("");
  const [prediction, setPrediction] = useState<number | null>(null);

  const { selectedField } = useAiRecommendationsContext();

  useEffect(() => {
    // Field must be selected
    if (!selectedField) {
      return;
    }

    // Load the model from the public folder
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel(
          `/model/${selectedField.toLocaleLowerCase}/model.json`
        );
        setModel(loadedModel);
        console.log("Model loaded successfully.");
      } catch (error) {
        console.error("Failed to load model:", error);
      }
    };

    // Load the keywords from the public folder
    const loadKeywords = async () => {
      try {
        const response = await fetch(
          `/model/${selectedField.toLocaleLowerCase()}/keywords.json`
        );
        const loadedKeywords = await response.json();
        setKeywords(loadedKeywords);
        console.log("Keywords loaded successfully.");
      } catch (error) {
        console.error("Failed to load keywords:", error);
      }
    };

    loadModel();
    loadKeywords();
  }, [selectedField]);

  const createKeywordVector = (description: string): number[] => {
    return keywords
      ? keywords.map((keyword) => (description.includes(keyword) ? 1 : 0))
      : [];
  };

  const handlePredict = () => {
    if (!model || !keywords || !inputText) return;

    const inputVector = createKeywordVector(inputText);
    const inputTensor = tf.tensor2d([inputVector]);

    const output = model.predict(inputTensor) as tf.Tensor;
    const predictedValue = output.dataSync()[0];

    setPrediction(predictedValue);
    inputTensor.dispose();
  };

  return (
    <div>
      <h3>Model Predictor</h3>
      <FieldSelector />
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to predict"
      />
      <button onClick={handlePredict} disabled={!model || !keywords}>
        Predict
      </button>
      {prediction !== null && (
        <p>Prediction: {prediction > 0.5 ? "Positive" : "Negative"}</p>
      )}
    </div>
  );
}
