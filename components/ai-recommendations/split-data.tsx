import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { useSelectedFileContext } from "@/context/selected-file-context";
import { useState } from "react";

const SplitData: React.FC = () => {
  const { selectedFile } = useSelectedFileContext();
  const { setTrainingData, setTestData, setKeywordData } =
    useAiRecommendationsContext();
  const [trainingProportion, setTrainingProportion] = useState(0.75);
  const [testProportion, setTestProportion] = useState(0.05);
  const [keywordsProportion, setKeywordsProportion] = useState(0.2);

  // Helper function to shuffle an array
  const shuffleArray = (array: string[]) => {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  const calculateSplit = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target) {
          // Split into lines and remove empty lines
          const data = (e.target.result as string).split("\n").filter(Boolean);

          // Extract the header
          const header = data[0];
          const rows = data.slice(1);

          // Shuffle data rows before splitting
          const shuffledData = shuffleArray(rows);

          const total = shuffledData.length;
          const trainingCount = Math.floor(total * trainingProportion);
          const testCount = Math.floor(total * testProportion);

          // Split the data into training, test, and keyword datasets
          const trainingData = [
            header,
            ...shuffledData.slice(0, trainingCount),
          ];
          const testData = [
            header,
            ...shuffledData.slice(trainingCount, trainingCount + testCount),
          ];
          const keywordData = [
            header,
            ...shuffledData.slice(trainingCount + testCount),
          ];

          // Update the context with the split data, each including the header
          setTrainingData(trainingData);
          setTestData(testData);
          setKeywordData(keywordData);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  return (
    <div className="split-data-container">
      <label htmlFor="training">
        Training Proportion:
        <input
          type="number"
          value={trainingProportion}
          onChange={(e) => setTrainingProportion(parseFloat(e.target.value))}
          min="0"
          max="1"
          step="0.1"
        />
      </label>
      <label htmlFor="test">
        Test Proportion:
        <input
          type="number"
          value={testProportion}
          onChange={(e) => setTestProportion(parseFloat(e.target.value))}
          min="0"
          max="1"
          step="0.1"
        />
      </label>
      <label htmlFor="keywords">
        Keywords Proportion:
        <input
          type="number"
          value={keywordsProportion}
          onChange={(e) => setKeywordsProportion(parseFloat(e.target.value))}
          min="0"
          max="1"
          step="0.1"
        />
      </label>
      <button
        disabled={
          trainingProportion + testProportion + keywordsProportion !== 1
        }
        onClick={calculateSplit}
      >
        OK
      </button>
    </div>
  );
};

export default SplitData;
