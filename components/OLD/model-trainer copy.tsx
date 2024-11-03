import { FormEvent, useRef, useState } from "react";
import Chart from "chart.js/auto";
import * as tf from "@tensorflow/tfjs";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { splitDataByMarker } from "@/utils/misc";

export default function ModelTrainer() {
  const MAX_CRS_ROWS_TRAIN = 5000
  const MAX_CRS_ROWS_TEST = 5000

  const { keywords, trainingData, testData, selectedField} = useAiRecommendationsContext();

  const [value0Training, setvalue0Training] = useState<string[]>([]);
  const [value12Training, setValue12Training] = useState<string[]>([]);
  const [value0Test, setvalue0Test] = useState<string[]>([]);
  const [value12Test, setValue12Test] = useState<string[]>([]);

  const splitByMarker = () => {
    if (trainingData && selectedField) {
      const { value0, value12 } = splitDataByMarker(
        trainingData,
        MAX_CRS_ROWS_TRAIN,
        selectedField
      );
      setvalue0Training(value0);
      setValue12Training(value12);
    }

    if (testData && selectedField) {
      const { value0, value12 } = splitDataByMarker(
        testData,
        MAX_CRS_ROWS_TEST,
        selectedField
      );
      setvalue0Test(value0);
      setValue12Test(value12);
  };
  
  
  const [model, setModel] = useState<tf.LayersModel>();
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [lossChart, setLossChart] = useState<Chart<"line">>();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const createModel = () => {
    if (!X) {
      console.error("X tensor is not defined");
      return;
    }

    // Convert tensor to array to get keyword count for input shape
    const keywordCount = X.shape[0];

    // Define the model with the input shape
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [keywordCount], // Set inputShape based on keyword count
        units: 128,
        activation: "relu",
      })
    );
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 16, activation: "relu" }));
    model.add(tf.layers.dense({ units: 8, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    setModel(model);
    console.log("Model created!");
  };

  // Convert keywords presence in new text to binary tensor
  const detectPresenceOfKeywords = (text: string): tf.Tensor => {
    // Convert X tensor to array of strings
    const keywordArray = Array.from(X.arraySync()) as string[];
    const detectedPresence = keywordArray.map((keyword) =>
      text.includes(keyword) ? 1 : 0
    );
    return tf.tensor2d([detectedPresence], [1, keywordArray.length]);
  };

  // Prediction function using detected keywords
  const makePredictionHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = inputRef.current?.value || "";
    const dataTensor = detectPresenceOfKeywords(text);
    const prediction = model!.predict(dataTensor) as tf.Tensor;
    const predictionValue = (await prediction.data())[0];
    const result = predictionValue >= 0.5 ? "Value: 12" : "Value: 0";

    console.log(`Prediction Score: ${predictionValue}, Result: ${result}`);
  };

  const trainModel = () => {
    //Training data
    return;
  };

  return (
    <div>
      <h3>1) Create Mmdel</h3>
      {!model && <button onClick={createModel}>Create Model</button>}
      {model && <p>✅ Model Created</p>}
      <h3>1) Train model</h3>
      {!model && <button onClick={trainModel}>Train Model</button>}
      {model && <p>✅ Model trained</p>}
      <h3>2) Make prediction</h3>
      {model && (
        <form onSubmit={makePredictionHandler}>
          <label htmlFor="text">
            <textarea
              id="text"
              ref={inputRef}
              rows={6}
              maxLength={10000}
              placeholder="Paste your text here"
            ></textarea>
          </label>
          <button type="submit">Make Prediction</button>
        </form>
      )}
    </div>
  );
}
