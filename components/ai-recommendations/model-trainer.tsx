import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { csv } from "d3-fetch";
import Prediction from "./prediction";

export default function ModelTrainer() {
  const NUM_EPOCHS = 10;

  console.log(NUM_EPOCHS);

  return null;

  const [keywords, setKeywords] = useState<string[]>([]);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [testData, setTestData] = useState<any[]>([]);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [testAccuracy, setTestAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFileData = async (filename: string): Promise<any> => {
    try {
      const response = await fetch(`/api/data/${filename}`);
      if (!response.ok) throw new Error(`Failed to fetch ${filename}`);

      if (filename.endsWith(".json")) return response.json();
      if (filename.endsWith(".csv")) return csv(await response.text());

      throw new Error("Unsupported file format");
    } catch (err) {
      console.error(err);
      setError(`Error loading ${filename}`);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchFileData("keywords.json"),
      fetchFileData("training_data.csv"),
      fetchFileData("test_data.csv"),
    ])
      .then(([loadedKeywords, loadedTrainingData, loadedTestData]) => {
        setKeywords(loadedKeywords || []);
        setTrainingData(loadedTrainingData || []);
        setTestData(loadedTestData || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  console.log(NUM_EPOCHS);
  console.log(keywords);
  console.log(trainingData);
  console.log(testData);

  const createKeywordVector = (description: string): number[] =>
    keywords.map((keyword) =>
      description.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0
    );

  const prepareTrainingData = () => {
    const value0Training = trainingData.filter((row) => row.Gender === "0");
    const value12Training = trainingData.filter(
      (row) => row.Gender === "1" || row.Gender === "2"
    );

    const trainingSamples = [
      ...value0Training.map((row) => row.LongDescription),
      ...value12Training.map((row) => row.LongDescription),
    ];
    const trainingLabels = [
      ...Array(value0Training.length).fill(0),
      ...Array(value12Training.length).fill(1),
    ];

    // Create vectors
    const trainingVectors = trainingSamples.map(createKeywordVector);

    // Ensure it's a 2D array with consistent dimensions
    const numSamples = trainingVectors.length;
    const numKeywords = keywords.length; // Number of features
    const xs = tf.tensor2d(trainingVectors, [numSamples, numKeywords]);
    const ys = tf.tensor1d(trainingLabels, "int32");

    return { xs, ys };
  };

  const createModel = () => {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [keywords.length],
        units: 128,
        activation: "relu",
      })
    );
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    model.compile({
      optimizer: tf.train.adam(),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    setModel(model);
  };

  const trainModel = async () => {
    if (!model) return;
    const { xs, ys } = prepareTrainingData();

    try {
      await model.fit(xs, ys, {
        epochs: NUM_EPOCHS,
        validationSplit: 0.2,
      });
      setTrainingCompleted(true);
    } finally {
      xs.dispose();
      ys.dispose();
    }
  };

  return (
    <div>
      <h3>Model Trainer</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!model && <button onClick={createModel}>Create Model</button>}
      {model && !trainingCompleted && (
        <button onClick={trainModel}>Train Model</button>
      )}
      {trainingCompleted && <p>Training Complete!</p>}
    </div>
  );
}
