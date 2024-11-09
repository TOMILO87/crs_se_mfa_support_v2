// ModelTrainer.tsx
import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { splitDataByMarker } from "@/utils/misc";
import Prediction from "./prediction";
import * as use from "@tensorflow-models/universal-sentence-encoder"; // Import Universal Sentence Encoder

export default function ModelTrainer() {
  const MAX_CRS_ROWS_TRAIN = 5000;
  const MAX_CRS_ROWS_TEST = 5000;
  const NUM_EPOCHS = 3;

  const { trainingData, testData, selectedField } =
    useAiRecommendationsContext();
  const [value0Training, setValue0Training] = useState<string[]>([]);
  const [value12Training, setValue12Training] = useState<string[]>([]);
  const [value0Test, setValue0Test] = useState<string[]>([]);
  const [value12Test, setValue12Test] = useState<string[]>([]);
  const [model, setModel] = useState<tf.LayersModel>();
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [testAccuracy, setTestAccuracy] = useState<number | null>(null);
  const [useEmbedder, setUseEmbedder] =
    useState<use.UniversalSentenceEncoder | null>(null);

  useEffect(() => {
    // Initialize the Universal Sentence Encoder model
    use.load().then((embedder) => {
      setUseEmbedder(embedder);
    });
  }, []);

  useEffect(() => {
    if (!trainingData || !testData || !selectedField) {
      console.log("Waiting for trainingData, testData, or selectedField...");
      return;
    }

    const { value0, value12 } = splitDataByMarker(
      trainingData,
      MAX_CRS_ROWS_TRAIN,
      selectedField
    );

    setValue0Training(value0);
    setValue12Training(value12);

    const { value0: value0Test, value12: value12Test } = splitDataByMarker(
      testData,
      MAX_CRS_ROWS_TEST,
      selectedField
    );
    setValue0Test(value0Test);
    setValue12Test(value12Test);
  }, [trainingData, testData, selectedField]);

  const createTextEmbedding = async (description: string) => {
    if (useEmbedder) {
      const embedding = await useEmbedder.embed([description]);
      return embedding.arraySync()[0]; // Return as a simple array
    }
    return [];
  };

  const prepareTrainingData = async () => {
    const trainingSamples = [...value0Training, ...value12Training];
    const trainingLabels = [
      ...Array(value0Training.length).fill(0),
      ...Array(value12Training.length).fill(1),
    ];

    // Create embeddings for each sample
    const trainingEmbeddings = await Promise.all(
      trainingSamples.map(async (description) => {
        return await createTextEmbedding(description);
      })
    );

    // If embeddings are valid, reshape and return
    if (
      trainingEmbeddings.every((embedding) => embedding && embedding.length)
    ) {
      const xs = tf.tensor2d(trainingEmbeddings, [
        trainingEmbeddings.length,
        trainingEmbeddings[0].length,
      ]);
      const ys = tf.tensor1d(trainingLabels, "int32");

      return { xs, ys };
    } else {
      console.error("Embeddings are not in the expected format.");
      return { xs: tf.tensor2d([]), ys: tf.tensor1d([]) }; // Empty tensors to prevent errors
    }
  };

  const createModel = (inputShape: number[]) => {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape,
        units: 128,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }), // Correct regularizer syntax
      })
    );
    model.add(tf.layers.dropout({ rate: 0.3 })); // Dropout layer to prevent overfitting

    model.add(
      tf.layers.dense({
        units: 64,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }), // Correct regularizer syntax
      })
    );
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }), // Correct regularizer syntax
      })
    );
    model.add(tf.layers.dropout({ rate: 0.3 }));

    model.add(
      tf.layers.dense({
        units: 1,
        activation: "sigmoid",
      })
    );

    model.compile({
      optimizer: tf.train.adam(),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    setModel(model);
  };

  const trainModel = async () => {
    if (!model) return;

    const { xs, ys } = await prepareTrainingData();

    // Display some initial feedback
    console.log("Training started...");

    await model.fit(xs, ys, {
      epochs: NUM_EPOCHS,
      validationSplit: 0.2,
      batchSize: 32, // Adjust batch size as needed for better progress
      callbacks: {
        onBatchEnd: (batch, logs) => {
          // Log progress after each batch
          console.log(
            `Batch ${batch}: Loss = ${logs.loss.toFixed(
              4
            )}, Accuracy = ${logs.acc?.toFixed(4)}`
          );
        },
        onEpochEnd: (epoch, logs) => {
          // Log progress after each epoch
          console.log(
            `Epoch ${epoch + 1}/${NUM_EPOCHS}: Loss = ${logs.loss.toFixed(
              4
            )}, Accuracy = ${logs.acc?.toFixed(4)}`
          );
        },
      },
    });

    setTrainingCompleted(true);
    xs.dispose();
    ys.dispose();

    // Save the model as a downloadable file
    await model.save("downloads://model");
    console.log("Model Saved Successfully!");
  };

  const evaluateModelOnTestData = async () => {
    if (!model) return;

    const testSamples = [...value0Test, ...value12Test];
    const testLabels = [
      ...Array(value0Test.length).fill(0),
      ...Array(value12Test.length).fill(1),
    ];

    const testEmbeddings = await Promise.all(
      testSamples.map(createTextEmbedding)
    );
    const xsTest = tf.tensor2d(testEmbeddings);
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
      {!model && useEmbedder && (
        <button onClick={() => createModel([512])}>Create Model</button>
      )}

      <h3>2) Train Model</h3>
      {model && !trainingCompleted && (
        <button onClick={trainModel}>Train Model</button>
      )}

      <h3>3) Test Prediction</h3>
      {trainingCompleted && (
        <Prediction model={model!} createTextEmbedding={createTextEmbedding} />
      )}

      {testAccuracy !== null && (
        <p>Test Accuracy: {(testAccuracy * 100).toFixed(2)}%</p>
      )}
    </div>
  );
}
