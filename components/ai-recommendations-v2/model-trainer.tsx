import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { splitDataByMarker } from "@/utils/misc";
import Prediction from "./prediction";

// Helper function to preprocess the text (tokenization, padding, etc.)
const preprocessText = (text: string, wordIndex: Record<string, number>) => {
  // Basic text cleaning and tokenization
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .map((word) => wordIndex[word] || 0); // Convert words to token indices, default to 0 if not found
};

// Manual padding function
const padSequences = (sequences: number[][], maxLength: number) => {
  return sequences.map((seq) => {
    if (seq.length < maxLength) {
      // Pad the sequence with zeros at the end
      return [...seq, ...Array(maxLength - seq.length).fill(0)];
    }
    return seq.slice(0, maxLength); // Truncate if sequence is too long
  });
};

const ModelTrainer = () => {
  const { trainingData, testData, selectedField } =
    useAiRecommendationsContext();
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [testAccuracy, setTestAccuracy] = useState<number | null>(null);

  const [value0Training, setValue0Training] = useState<string[]>([]);
  const [value12Training, setValue12Training] = useState<string[]>([]);
  const [value0Test, setValue0Test] = useState<string[]>([]);
  const [value12Test, setValue12Test] = useState<string[]>([]);

  const MAX_CRS_ROWS_TRAIN = Number.MAX_SAFE_INTEGER;
  const MAX_CRS_ROWS_TEST = Number.MAX_SAFE_INTEGER;
  const NUM_EPOCHS = 5;
  const MAX_SEQUENCE_LENGTH = 100; // Maximum length of tokenized sequences

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

  // Create a word index (a simple example of how to build a token-to-index mapping)
  const buildWordIndex = (texts: string[]) => {
    const wordCount: Record<string, number> = {};
    texts.forEach((text) => {
      const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    // Create an index of words, assigning an index to each unique word
    const wordIndex: Record<string, number> = {};
    let index = 1;
    Object.keys(wordCount).forEach((word) => {
      wordIndex[word] = index++;
    });

    return wordIndex;
  };

  // Prepare training data: Convert text into sequences of integers (tokens)
  const prepareTrainingData = () => {
    const trainingSamples = [...value0Training, ...value12Training];
    const trainingLabels = [
      ...Array(value0Training.length).fill(0),
      ...Array(value12Training.length).fill(1),
    ];

    // Build word index from the training data
    const wordIndex = buildWordIndex(trainingSamples);

    // Tokenize text (convert words to integers)
    const tokenizedTrainingData = trainingSamples.map((text) =>
      preprocessText(text, wordIndex)
    );

    return { tokenizedTrainingData, trainingLabels };
  };

  // Create a simple model with an embedding layer
  const createModel = () => {
    const model = tf.sequential();

    // Define a trainable embedding layer
    model.add(
      tf.layers.embedding({
        inputDim: 20000, // Vocabulary size (adjust based on your data)
        outputDim: 128, // Embedding dimension
        inputLength: MAX_SEQUENCE_LENGTH,
      })
    );

    // Add a simple LSTM layer
    model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: false,
      })
    );

    // Add dense layers for classification
    model.add(
      tf.layers.dense({
        units: 64,
        activation: "relu",
      })
    );

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

  // Train the model
  const trainModel = async () => {
    if (!model) return;

    const { tokenizedTrainingData, trainingLabels } = prepareTrainingData();

    // Pad the sequences manually
    const paddedTrainingData = padSequences(
      tokenizedTrainingData,
      MAX_SEQUENCE_LENGTH
    );

    const xs = tf.tensor2d(paddedTrainingData);
    const ys = tf.tensor1d(trainingLabels, "int32");

    await model.fit(xs, ys, {
      epochs: NUM_EPOCHS,
      batchSize: 64,
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

    // Save the model
    await model.save("downloads://model");
  };

  // Evaluate the model on the test data
  const evaluateModelOnTestData = async () => {
    if (!model) return;

    const testSamples = [...value0Test, ...value12Test];
    const testLabels = [
      ...Array(value0Test.length).fill(0),
      ...Array(value12Test.length).fill(1),
    ];

    // Tokenize test data
    const wordIndex = buildWordIndex([...value0Training, ...value12Training]);
    const tokenizedTestData = testSamples.map((text) =>
      preprocessText(text, wordIndex)
    );

    // Pad sequences manually
    const paddedTestData = padSequences(tokenizedTestData, MAX_SEQUENCE_LENGTH);

    const xsTest = tf.tensor2d(paddedTestData);
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
      {trainingCompleted && <Prediction model={model} />}

      {testAccuracy !== null && (
        <p>Test Accuracy: {(testAccuracy * 100).toFixed(2)}%</p>
      )}
    </div>
  );
};

export default ModelTrainer;
