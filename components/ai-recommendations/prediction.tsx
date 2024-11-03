import { FormEvent, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";

interface PredictionProps {
  model: tf.LayersModel;
  createKeywordVector: (description: string) => number[];
}

export default function Prediction({
  model,
  createKeywordVector,
}: PredictionProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [result, setResult] = useState<string>("");

  const makePredictionHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = inputRef.current?.value || "";
    const keywordVector = tf.tensor2d([createKeywordVector(description)]);
    const prediction = model.predict(keywordVector) as tf.Tensor;
    const predictionValue = (await prediction.data())[0];
    setResult(predictionValue >= 0.5 ? "Value: 12" : "Value: 0");

    keywordVector.dispose();
  };

  return (
    <form onSubmit={makePredictionHandler}>
      <textarea ref={inputRef} placeholder="Enter description for prediction" />
      <button type="submit">Predict Marker Value</button>
      {result && <p>Prediction Result: {result}</p>}
    </form>
  );
}
