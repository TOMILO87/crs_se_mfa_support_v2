// Replace with components

import { FormEvent, useRef, useState } from "react";
import { readWords } from "../utils/misc";
import Chart from "chart.js/auto";
import * as tf from "@tensorflow/tfjs";

// TODO: Move functions to utils file or similar
export default function ModelTrainer() {
  const [model, setModel] = useState<tf.LayersModel>();
  const [X, setX] = useState<any>();
  const [Y, setY] = useState<any>();
  const [lossChart, setLossChart] = useState<Chart<"line">>();
  const [trainingCompleted, settrainingCompleted] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = "Klistra in insatsbeskrivning här";
  const rows = 6;
  const maxLength = 10000;

  const createModel = () => {
    // Define the model
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ inputShape: [800], units: 128, activation: "relu" })
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

    // Set the model
    setModel(model);

    console.log("Model created!");
  };

  const loadTrainingData = async () => {
    // Load input data
    getFileContent("X_test.txt", setX);
    getFileContent("Y_test.txt", setY);

    console.log("Training data loaded!");
  };

  const getFileContent = async (
    file: string,
    setState: (value: any) => void
  ) => {
    // File must be located in public folder
    try {
      const response = await fetch(`/api/getFileContent/${file}`);
      if (!response.ok) {
        throw new Error("Failed to fetch file content");
      }
      const { content } = await response.json();
      setState(content);
    } catch (error) {
      console.error(error);
    }
  };

  const convertDataToTensors = (data: string) => {
    const arr = data
      .trim()
      .split("\n")
      .map((row: string) => row.split(" ").map(Number));

    return tf.tensor2d(arr, [arr.length, arr[0].length]);
  };

  const createNewChart = () => {
    const ctx = document.getElementById("lossChart") as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Loss",
            data: [],
            borderColor: "blue",
            borderWidth: 1,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: "linear",
            position: "bottom",
          },
          y: {
            min: 0,
          },
        },
      },
    });

    setLossChart(chart);
    return chart;
  };

  const trainModel = async () => {
    // Convert data to TensorFlow tensors
    const xTensor = convertDataToTensors(X);
    const yTensor = convertDataToTensors(Y);

    // Create a new Chart.js instance
    const chart = createNewChart();

    // Define a custom callback function to track progress
    const customCallback: tf.CustomCallbackArgs = {
      onEpochEnd: async (epoch: number, logs?: tf.Logs) => {
        //console.log(`Epoch ${epoch}: loss = ${logs!.loss}`);

        // Update the chart with the loss value
        chart.data.labels.push(epoch.toString());
        chart.data.datasets[0].data.push(logs!.loss);
        chart.update();
      },
    };

    // Train the model with progress tracking
    model!
      .fit(xTensor, yTensor, {
        epochs: 50,
        shuffle: true,
        validationSplit: 0.2, // 20% of the data will be used for validation
        callbacks: customCallback,
      })
      .then(() => {
        console.log("Training is complete!");
        settrainingCompleted(true);
      });
  };

  const detectPresenceOfKeywords = async (text: string) => {
    const fetchedWords = await readWords();
    //console.log(fetchedWords);
    //if in keywords then 1 else 0
    const detectedPresence = fetchedWords.map((word) => text.includes(word));

    // Convert boolean array to string of 0s and 1s
    return detectedPresence.map((bool) => (bool ? "1" : "0")).join(" ");
  };

  const makePredictionHandler = async (event: FormEvent<HTMLFormElement>) => {
    const text = inputRef.current?.value;
    event.preventDefault();
    console.log(text);
    const data = await detectPresenceOfKeywords(text!);

    const X = convertDataToTensors(data);
    const predict = model!.predict(X) as tf.Tensor;
    const prediction = predict.dataSync()[0];

    const binaryPrediction = prediction >= 0.5 ? 1 : 0;
    console.log(prediction, binaryPrediction);
  };

  return (
    <>
      <h2>1) Create model</h2>
      {!model && <button onClick={createModel}>Create model</button>}
      {model && <p>✅</p>}
      <h2>2) Load data</h2>
      {(!X || !Y) && (
        <button disabled={!model} onClick={loadTrainingData}>
          Load data
        </button>
      )}
      {X && Y && <p>✅</p>}
      <h2>3) Train model</h2>
      {!lossChart && (
        <button disabled={!model || !X || !Y} onClick={() => trainModel()}>
          Train model
        </button>
      )}
      {trainingCompleted && <p>✅</p>}
      <div>
        <canvas id="lossChart"></canvas>
      </div>
      <h2>4) Make prediction</h2>
      {trainingCompleted && (
        <form onSubmit={makePredictionHandler}>
          <label htmlFor={"text"}>
            <textarea
              id={"text"}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              ref={inputRef}
            ></textarea>
          </label>
          <button type="submit">Make prediction</button>
        </form>
      )}
    </>
  );
}

//trainingCompleted && <p>✅</p>}

// Add form for text

/*

<button onClick={regressionTest}>Regression test</button>
      <button onClick={() => makePrediction("gender")}>Make prediction</button>
      <button onClick={() => trainModel("gender")} hidden={trainButtonHidden}>
        Train model public
      </button>
      {predictedValue}

  const trainModel = () => {}

  };

  const loadModelPublic = async () => {
    // Construct the full path to the model file inside the public folder
    //const modelPath = "https://crs-se-mfa-support.vercel.app/my-model.json";
    // Load the model using the constructed path
    //const model = await tf.loadLayersModel(modelPath);
    //setModel(model);
  };

  const makePrediction = async (marker: string) => {
    // Make a prediction
    const predict = model!.predict(tf.tensor2d([5], [1, 1])) as tf.Tensor;
    setPredcitedValue(predict.dataSync()[0]);
  };

  const regressionTest = async () => {
    // Define a model for linear regression.
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ loss: "meanSquaredError", optimizer: "sgd" });

    // Specify some synthetic data for training.
    const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
    const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

    // Fit the model
    model.fit(xs, ys, { epochs: 400 });

    // Make a prediction
    const predict = model.predict(tf.tensor2d([5], [1, 1])) as tf.Tensor;
    setPredcitedValue(predict.dataSync()[0]);

    // Save the trained model
    await model.save("localstorage://my-model");
  };
*/

// Load model when rendering page
//useEffect(() => {
//  loadModelPublic();
//}, []);
