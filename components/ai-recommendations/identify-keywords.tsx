import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";
import { useState } from "react";
import { splitDataByMarker } from "@/utils/misc";

const IdentifyKeywords: React.FC = () => {
  const MAX_CRS_ROWS = Number.MAX_SAFE_INTEGER; // used during development
  const MAX_KEYWORDS = 800;
  const BIG_SAMPLE_SIZE = 40;
  const SMALL_SAMPLE_SIZE = 3;
  const TIME_LIMIT_MS = (60000 / 60) * 30; // in milliseconds

  const { selectedField, setKeywords, keywordData } =
    useAiRecommendationsContext();

  // Contain project descriptions per marker value
  const [value0, setValue0] = useState<string[]>([]);
  const [value12, setValue12] = useState<string[]>([]);

  // Contain keywords per marker value
  const [keywords0, setKeywords0] = useState<string[]>([]);
  const [keywords12, setKeywords12] = useState<string[]>([]);

  // Get descriptions per marker value
  const splitByMarker = () => {
    if (keywordData && selectedField) {
      const { value0, value12 } = splitDataByMarker(
        keywordData,
        MAX_CRS_ROWS,
        selectedField
      );
      setValue0(value0);
      setValue12(value12);
    }
  };

  // Look for word more common in small sample than big sample
  const getUniqueWordsSmall = (smallValue: string[], bigValue: string[]) => {
    const sampledSmall = getRandomSamples(smallValue, SMALL_SAMPLE_SIZE);
    const sampledBig = getRandomSamples(bigValue, BIG_SAMPLE_SIZE);
    const commonWordsSmall = getCommonWords(sampledSmall);

    return filterUniqueWords(commonWordsSmall, sampledBig);
  };

  // Get keywords for separating value 0 and value 1, 2
  const extractKeywords = (value12: string[], value0: string[]) => {
    const keywords: Set<string> = new Set();
    const startTime = Date.now();

    while (keywords.size < MAX_KEYWORDS) {
      if (Date.now() - startTime >= TIME_LIMIT_MS) {
        console.log("Time limit reached, stopping keyword extraction.");
        break;
      }
      handleKeywordsUpdate();
    }
  };

  // Function to add unique keywords to an array
  const addUniqueKeywords = (
    existingKeywords: string[],
    newKeywords: string[]
  ) => {
    const existingSet = new Set(existingKeywords);
    return [
      ...existingKeywords,
      ...newKeywords.filter((keyword) => !existingSet.has(keyword)),
    ];
  };

  const handleKeywordsUpdate = () => {
    // Get keywords for 0
    const keywords0 = getUniqueWordsSmall(value0, value12);
    setKeywords0((prevKeywords) => addUniqueKeywords(prevKeywords, keywords0));

    // Get keywords for 12
    const keywords12 = getUniqueWordsSmall(value12, value0);
    setKeywords12((prevKeywords) =>
      addUniqueKeywords(prevKeywords, keywords12)
    );

    // Combine keywords from keywords0 and keywords12 for the overall keyword array, ensuring uniqueness
    const combinedKeywords = addUniqueKeywords(
      addUniqueKeywords(keywords0, keywords12),
      []
    );

    if (combinedKeywords.length < MAX_KEYWORDS) {
      setKeywords((prevKeywords) =>
        addUniqueKeywords(prevKeywords || [], combinedKeywords)
      );
    }
  };

  const getRandomSamples = (array: string[], sampleSize: number): string[] => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  };

  const getCommonWords = (samples: string[]): string[] => {
    const wordSets = samples
      .filter((sample) => sample) // Remove any empty or undefined samples
      .map((sample) => new Set(sample.split(" ")));

    if (wordSets.length === 0) return []; // Return an empty array if there are no valid samples

    return [...wordSets[0]].filter((word) =>
      wordSets.every((set) => set.has(word))
    );
  };

  const filterUniqueWords = (words: string[], samples: string[]): string[] => {
    const wordsInSamples = new Set(
      samples.flatMap((sample) => sample.split(" "))
    );
    return words.filter((word) => !wordsInSamples.has(word));
  };

  const showKeywords = () => {
    const popupWindow = window.open("", "_blank", "width=300,height=400");
    popupWindow?.document.write(`
        <html>
            <head>
                <title>Keywords</title>
            </head>
            <body>
                <h2>Keywords for Value 0</h2>
                <ul>
                    ${keywords0
                      .map((keyword) => `<li>${keyword}</li>`)
                      .join("")}
                </ul>
                <h2>Keywords for Value 12</h2>
                <ul>
                    ${keywords12
                      .map((keyword) => `<li>${keyword}</li>`)
                      .join("")}
                </ul>
            </body>
        </html>
    `);
  };

  return (
    <div>
      <button onClick={splitByMarker}>Split by marker</button>
      <button
        disabled={!selectedField}
        onClick={() => extractKeywords(value12, value0)}
      >
        Identify keywords
      </button>
      <button onClick={showKeywords}>Show keywords</button>
    </div>
  );
};

export default IdentifyKeywords;
