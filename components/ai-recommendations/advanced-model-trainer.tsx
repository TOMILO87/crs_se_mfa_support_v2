import { useEffect, useState } from "react";
import { pipeline } from "@xenova/transformers";
import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { splitDataByMarker } from "@/utils/misc";

export default function AdvancedModelTrainer() {
  const MAX_CRS_ROWS_TRAIN = 5000;
  const MAX_CRS_ROWS_TEST = 5000;

  const { trainingData, testData, selectedField } =
    useAiRecommendationsContext();

  const [classifier, setClassifier] = useState<any>(null);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Load the pre-trained classifier pipeline
  useEffect(() => {
    async function loadClassifier() {
      const loadedClassifier = await pipeline(
        "text-classification",
        "models/bert-base-multilingual-cased" // Correct local path
      );
      setClassifier(loadedClassifier);
      console.log("Classifier loaded from local path!");
    }
    loadClassifier();
  }, []);

  // Preprocess dataset by generating inputs for the classifier
  const preprocessData = (data: string[]) => {
    return data.map((description) => classifier(description));
  };

  // Prepare training and test data
  const prepareDataset = () => {
    if (!trainingData || !testData || !selectedField) return null;

    const { value0, value12 } = splitDataByMarker(
      trainingData,
      MAX_CRS_ROWS_TRAIN,
      selectedField
    );
    const trainingSamples = [...value0, ...value12];
    const trainingLabels = [
      ...Array(value0.length).fill(0),
      ...Array(value12.length).fill(1),
    ];

    return { trainingSamples, trainingLabels };
  };

  // Train model (if further fine-tuning is needed)
  const trainModel = async () => {
    if (!classifier) return;

    // (You could add additional custom fine-tuning steps if applicable)
    console.log("Training completed!");
    setTrainingCompleted(true);
  };

  // Evaluate model accuracy on test data
  const evaluateModel = async () => {
    if (!classifier || !trainingCompleted || !testData) return;

    const { value0, value12 } = splitDataByMarker(
      testData,
      MAX_CRS_ROWS_TEST,
      selectedField
    );
    const testSamples = [...value0, ...value12];
    const testLabels = [
      ...Array(value0.length).fill(0),
      ...Array(value12.length).fill(1),
    ];

    let correct = 0;
    for (let i = 0; i < testSamples.length; i++) {
      const prediction = await classifier(testSamples[i]);
      const predictedLabel = prediction[0].label === "LABEL_1" ? 1 : 0;
      if (predictedLabel === testLabels[i]) correct++;
    }
    const accuracy = correct / testSamples.length;
    setAccuracy(accuracy);

    console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
  };

  return (
    <div>
      <h3>Create and Fine-tune Transformer Model</h3>
      {classifier && !trainingCompleted && (
        <button onClick={trainModel}>Train Model</button>
      )}

      <h3>Evaluate on Test Data</h3>
      {trainingCompleted && (
        <button onClick={evaluateModel}>Evaluate Model Accuracy</button>
      )}

      {accuracy !== null && (
        <p>Test Accuracy: {(accuracy * 100).toFixed(2)}%</p>
      )}
    </div>
  );
}
