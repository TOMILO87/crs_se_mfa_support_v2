//TODO: make selectable input marker "Gender" | "Environment";
import { useState } from "react";
import styles from "./identify-keywords.module.css";

interface IdentifyKeywordsProps {
  marker: "Gender" | "Envrionment";
}

const IdentifyKeywords: React.FC<IdentifyKeywordsProps> = ({ marker }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Contribution discriptions with marker value 0 and 1 or 2
  const [value0, setValue0] = useState<string[]>([]);
  const [value12, setValue12] = useState<string[]>([]);

  // Keywords which discriminate between different marker values
  const [keyWords, setKeyWords] = useState<string[]>([]);

  // Handle uploaded file
  const fileInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Split contributions depending on policy marker value
  const splitByMarker = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target) {
          const content = e.target.result as string;
          splitByMarkerHelper(content);
        }
      };
      reader.readAsText(selectedFile);
    }

    // Split by marker helper function
    const splitByMarkerHelper = (content: string) => {
      const rows = content.split("\n");
      const headerRow = rows.shift(); // Remove the header row
      const headers = headerRow!.split("|");

      // Get index of columens of interest
      const longDescriptionIndex = headers.indexOf('"LongDescription"');
      const usdDisbursementIndex = headers.indexOf('"USD_Disbursement"');
      const markerIndex = headers.indexOf(`${marker}`);

      // Split contributions into arrays by marker value and disbursements
      rows.forEach((row) => {
        const columns = row.split("|");
        const markerValue = columns[markerIndex];
        const amountValue = parseFloat(columns[usdDisbursementIndex]);
        const positiveAmount = amountValue > 0;
        const descriptionValue = columns[longDescriptionIndex];
        const preprocessedDescription = preprocessText(descriptionValue);

        if (["1", "2"].includes(markerValue) && positiveAmount) {
          setValue12((prevRows) => [...prevRows, preprocessedDescription]);
        } else if (positiveAmount) {
          setValue0((prevRows) => [...prevRows, preprocessedDescription]);
        }
      });
    };
  };

  //const keywords = extractKeywords(preprocessedDescription);
  //console.log(keywords);

  console.log("value 0", value0);
  console.log("value 1, 2", value12);

  // Find keywords in contributions for different policy markers
  const findKeyword = () => {};

  const preprocessText = (text: string): string => {
    let processedText = text.toLowerCase();
    processedText = processedText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    processedText = processedText.replace(/\s{2,}/g, " ");
    return processedText;
  };

  const extractKeywords = (text: string): string[] => {
    const words = text.split(" ");
    const stopwords = new Set(["and", "the", "of", "to", "a", "in"]);
    const keywords = words.filter(
      (word) => !stopwords.has(word) && word.match(/^[a-zA-Z0-9]+$/)
    );
    const keyFeatures = keywords.slice(0, 5);
    return keyFeatures;
  };

  return (
    <div className={styles["identify-keywords"]}>
      <h3>Choose CRS file</h3>
      <label htmlFor="fileInput">
        Upload file:
        <input
          type="file"
          id="fileInput"
          accept=".txt"
          onChange={fileInputHandler}
        />
      </label>
      <button disabled={!selectedFile} onClick={splitByMarker}>
        Split data by marker
      </button>
    </div>
  );
};

export default IdentifyKeywords;

/*
<button onClick={onClickOkHandler}>Ok</button>
// <button disabled={!file}>Choose policymarker</button>

export enum Marker {
  Gender,
  Environemt,
}

interface IdentifyKeywordsProps {
  //file?: File; //CRS-file
  //marker?: Marker; //policy marker
}

const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const onClickOkHandler = () => {
    if (selectedFile) {
      const reader = new FileReader();

      reader.onload = function (event) {
        if (event.target) {
          const content = event.target.result as string;
          // Split the content into rows
          const rows = content.split("\n");
          console.log(rows);

          SDF;
          // Loop through each row
          rows.forEach((row) => {
            // Split the row into columns based on the delimiter "|"
            const columns = row.split("|");
            // Access the specific column you're interested in, for example, the third column
            const thirdColumn = columns[2];
            console.log(thirdColumn);
            // Do something with the column content
          });
        }
      };

      reader.readAsText(selectedFile);
    }
  };

*/
