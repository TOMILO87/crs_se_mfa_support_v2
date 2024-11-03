import { FormEvent, useRef, useState } from "react";
import Chart from "chart.js/auto";
import * as tf from "@tensorflow/tfjs";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";

export default function ModelTrainer() {
  const { keywords: X } = useAiRecommendationsContext();
  const [model, setModel] = useState<tf.LayersModel | undefined>(undefined);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [lossChart, setLossChart] = useState<Chart<"line">>();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const createModel = () => {
    if (!X) {
      console.error("X tensor is not defined");
      return;
    }

    const keywordCount = X.shape[0];

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [keywordCount],
        units: 128,
        activation: "relu",
      })
    );
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 16, activation: "relu" }));
    model.add(tf.layers.dense({ units: 8, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
    setModel(model);
  };

  const trainModel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!model || !X) {
      console.error("Model or X tensor is not defined");
      return;
    }

    const y = tf.tensor2d(
      [...Array(X.shape[0])].map(() => (Math.random() > 0.5 ? 1 : 0)),
      [X.shape[0], 1]
    );

    const history = await model.fit(X, y, {
      epochs: 100,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (lossChart) {
            lossChart.data.labels?.push(epoch);
            lossChart.data.datasets[0].data.push(logs.loss);
            lossChart.update();
          }
        },
      },
    });

    setTrainingCompleted(true);
  };

  const initLossChart = () => {
    if (lossChart) return; // Prevent re-initialization
    const ctx = document.getElementById("lossChart") as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Loss",
            data: [],
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderWidth: 1,
          },
        ],
      },
    });
    setLossChart(chart);
  };

  return (
    <div>
      <h2>Model Trainer</h2>
      <button onClick={createModel}>Create Model</button>
      <form onSubmit={trainModel}>
        <button type="submit" disabled={!model || trainingCompleted}>
          Train Model
        </button>
      </form>
      <canvas id="lossChart" ref={inputRef} />
      {initLossChart()}
    </div>
  );
}
