// ModelTrainer.tsx
import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { splitDataByMarker } from "@/utils/misc";
import Prediction from "./prediction";

export default function ModelTrainer() {
  const MAX_CRS_ROWS_TRAIN = 5000;
  const MAX_CRS_ROWS_TEST = 5000;
  const NUM_EPOCHS = 3;

  const { keywords, trainingData, testData, selectedField } =
    useAiRecommendationsContext();
  const [value0Training, setValue0Training] = useState<string[]>([]);
  const [value12Training, setValue12Training] = useState<string[]>([]);
  const [value0Test, setValue0Test] = useState<string[]>([]);
  const [value12Test, setValue12Test] = useState<string[]>([]);
  const [model, setModel] = useState<tf.LayersModel>();
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [testAccuracy, setTestAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (trainingData && selectedField) {
      const { value0, value12 } = splitDataByMarker(
        trainingData,
        MAX_CRS_ROWS_TRAIN,
        selectedField
      );
      setValue0Training(value0);
      setValue12Training(value12);
    }

    if (testData && selectedField) {
      const { value0, value12 } = splitDataByMarker(
        testData,
        MAX_CRS_ROWS_TEST,
        selectedField
      );
      setValue0Test(value0);
      setValue12Test(value12);
    }
  }, [trainingData, testData, selectedField]);

  const createKeywordVector = (description: string): number[] => {
    return keywords!.map((keyword) => (description.includes(keyword) ? 1 : 0));
  };

  const prepareTrainingData = () => {
    const trainingSamples = [...value0Training, ...value12Training];
    const trainingLabels = [
      ...Array(value0Training.length).fill(0),
      ...Array(value12Training.length).fill(1),
    ];

    const trainingVectors = trainingSamples.map(createKeywordVector);
    const xs = tf.tensor2d(trainingVectors);
    const ys = tf.tensor1d(trainingLabels, "int32");

    return { xs, ys };
  };

  const createModel = () => {
    const inputShape = [keywords!.length];
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape, units: 128, activation: "relu" }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
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
    await model.fit(xs, ys, {
      epochs: NUM_EPOCHS,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch}: Loss = ${logs?.loss}, Accuracy = ${logs?.acc}`
          );
        },
      },
    });

    setTrainingCompleted(true);
    xs.dispose();
    ys.dispose();

    // Save the model as a downloadable file
    await model.save("downloads://model");

    // Save keywords as JSON file
    const keywordsBlob = new Blob([JSON.stringify(keywords)], {
      type: "application/json",
    });
    const keywordsUrl = URL.createObjectURL(keywordsBlob);
    const keywordsLink = document.createElement("a");
    keywordsLink.href = keywordsUrl;
    keywordsLink.download = "keywords.json";
    keywordsLink.click();
  };

  const evaluateModelOnTestData = () => {
    if (!model) return;

    const testSamples = [...value0Test, ...value12Test];
    const testLabels = [
      ...Array(value0Test.length).fill(0),
      ...Array(value12Test.length).fill(1),
    ];

    const testVectors = testSamples.map(createKeywordVector);
    const xsTest = tf.tensor2d(testVectors);
    const ysTest = tf.tensor1d(testLabels, "int32");

    const evaluation = model.evaluate(xsTest, ysTest) as tf.Scalar[];
    const accuracy = evaluation[1].dataSync()[0];

    setTestAccuracy(accuracy);
    console.log(`Test Accuracy: ${accuracy}`);

    xsTest.dispose();
    ysTest.dispose();
  };

  useEffect(() => {
    if (trainingCompleted) evaluateModelOnTestData();
  }, [trainingCompleted]);

  return (
    <div>
      <h3>1) Create Model</h3>
      {!model && <button onClick={createModel}>Create Model</button>}

      <h3>2) Train Model</h3>
      {model && !trainingCompleted && (
        <button onClick={trainModel}>Train Model</button>
      )}

      <h3>3) Test Prediction</h3>
      {trainingCompleted && (
        <Prediction model={model!} createKeywordVector={createKeywordVector} />
      )}

      {testAccuracy !== null && (
        <p>Test Accuracy: {(testAccuracy * 100).toFixed(2)}%</p>
      )}
    </div>
  );
}
