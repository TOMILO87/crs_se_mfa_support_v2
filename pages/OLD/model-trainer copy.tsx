import { FormEvent, useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { splitDataByMarker } from "@/utils/misc";

export default function ModelTrainer() {
  const MAX_CRS_ROWS_TRAIN = 5000;
  const MAX_CRS_ROWS_TEST = 5000;

  const { keywords, trainingData, testData, selectedField } =
    useAiRecommendationsContext();

  const [value0Training, setvalue0Training] = useState<string[]>([]);
  const [value12Training, setValue12Training] = useState<string[]>([]);
  const [value0Test, setvalue0Test] = useState<string[]>([]);
  const [value12Test, setValue12Test] = useState<string[]>([]);
  const [model, setModel] = useState<tf.LayersModel>();
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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
    }
  }, [trainingData, testData, selectedField]);

  // Create keyword presence vector from a description
  const createKeywordVector = (description: string): number[] => {
    return keywords.map((keyword) => (description.includes(keyword) ? 1 : 0));
  };

  // Prepare training tensors from the descriptions and markers
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

  // Create the model
  const createModel = () => {
    const inputShape = [keywords.length];
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
    console.log("Model created!d");
  };

  // Train the model
  const trainModel = async () => {
    if (!model) return;

    const { xs, ys } = prepareTrainingData();
    const history = await model.fit(xs, ys, {
      epochs: 20,
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
    console.log("Training completed!");
  };

  // Predict marker value based on input text
  const makePredictionHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!model) return;

    const description = inputRef.current?.value || "";
    const keywordVector = tf.tensor2d([createKeywordVector(description)]);
    const prediction = model.predict(keywordVector) as tf.Tensor;
    const predictionValue = (await prediction.data())[0];
    const result = predictionValue >= 0.5 ? "Value: 12" : "Value: 0";

    console.log(`Prediction Score: ${predictionValue}, Result: ${result}`);
    keywordVector.dispose();
  };

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
        <form onSubmit={makePredictionHandler}>
          <textarea
            ref={inputRef}
            placeholder="Enter description for prediction"
          />
          <button type="submit">Predict Marker Value</button>
        </form>
      )}
    </div>
  );
}
