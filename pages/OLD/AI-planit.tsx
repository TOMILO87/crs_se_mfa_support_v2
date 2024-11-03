/*TODO
- Download all CRS data for a couple of years (also useful for imputed)
- Look my blog post nn and policy marker preduction based on words
- Train corresponding model using tensorflow.js
- Save trained model in public folder
- Test prediction new contribution Planit
- Present for colleagues version with only policy marker
- Collect responses and add more fields 
- Present division and invite ideas for applications
*/

import { useEffect, useState } from "react";
import Head from "next/head";

import * as tf from "@tensorflow/tfjs";

export default function AIPlanit() {
  const trainButtonHidden = false;
  const [predictedValue, setPredcitedValue] = useState<null | number>(null);
  const [model, setModel] = useState<null | tf.LayersModel>(null);

  console.log(model);

  // Load model when rendering page
  useEffect(() => {
    loadModelPublic();
  }, []);

  const loadModelPublic = async () => {
    // Construct the full path to the model file inside the public folder
    const modelPath = "https://crs-se-mfa-support.vercel.app/my-model.json";

    // Load the model using the constructed path
    const model = await tf.loadLayersModel(modelPath);
    setModel(model);
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

  const trainModel = async (marker: string) => {};

  return (
    <>
      <Head>
        <title>AI Planit</title>
      </Head>
      <h1>Machine Learning</h1>
      <button onClick={regressionTest}>Regression test</button>
      <button onClick={() => makePrediction("gender")}>Make prediction</button>
      <button onClick={() => trainModel("gender")} hidden={trainButtonHidden}>
        Train model public
      </button>
      {predictedValue}
    </>
  );
}
