import { eng, fra, spa, removeStopwords } from "stopword";

export const splitDataByMarker = (
  rows: string[],
  maxRows: number,
  marker: string
): { value0: string[]; value12: string[] } => {
  const headerRow = rows[0];
  const headers = headerRow.split("|");

  const longDescriptionIndex = headers.indexOf('"LongDescription"');
  const usdDisbursementIndex = headers.indexOf('"USD_Disbursement"');
  const markerIndex = headers.indexOf(`"${marker}"`);

  let remaining_rows = maxRows;
  let value0: string[] = [];
  let value12: string[] = [];

  rows.slice(1).forEach((row) => {
    if (remaining_rows === 0) return;

    remaining_rows -= 1;

    const columns = row.split("|");
    const markerValue = columns[markerIndex];
    const amountValue = parseFloat(columns[usdDisbursementIndex]);
    const descriptionValue = columns[longDescriptionIndex];
    const positiveAmount = amountValue > 0;

    if (!descriptionValue) return;

    // Remove stopwords etc.
    const preprocessedDescription = preprocessText(descriptionValue);

    if (["1", "2"].includes(markerValue) && positiveAmount) {
      value12 = [...value12, preprocessedDescription];
    } else if (["0"].includes(markerValue) && positiveAmount) {
      value0 = [...value0, preprocessedDescription];
    }
  });

  return { value0, value12 };
};

// Remove stop words, invalid words, numbers etc. from descriptions
const preprocessText = (text: string): string => {
  let processedText = text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ");
  processedText = removeMultilingualStopwords(processedText);

  return processedText
    .split(" ")
    .filter((word) => !isInvalidWord(word))
    .join(" ");
};

const removeMultilingualStopwords = (text: string): string => {
  const words = text.split(" ");

  // Create a combined list of stopwords for English, French, and Spanish
  const multilingualStopwords = [...eng, ...fra, ...spa];

  // Remove stopwords from the text using the combined stopword list
  const filteredWords = removeStopwords(words, multilingualStopwords);

  return filteredWords.join(" ");
};

const isInvalidWord = (word: string): boolean => {
  const romanNumeralsPattern = /^i{1,3}$/;
  return (
    /^\d+$/.test(word) || word.length === 1 || romanNumeralsPattern.test(word)
  );
};
