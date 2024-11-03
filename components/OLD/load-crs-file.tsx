import { useState } from "react";

const LoadCrsFile: React.FC = () => {
  const COLUMNS_OF_INTEREST = [
    '"Year"',
    '"DonorName"',
    '"USD_Disbursement"',
    '"LongDescription"',
  ];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle uploaded file
  const fileInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Read file content
  const readFileContent = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target) {
          const content = e.target.result as string;

          // Split string into rows
          const rows = content.split("\n");
          const headerRow = rows.shift(); // Remove the header row
          const headers = headerRow!.split("|");

          console.log(headers);

          const yearIndex = headers.indexOf('"Year"');
          const donorNameIndex = headers.indexOf('"DonorName"');
          const usdDisbursementIndex = headers.indexOf('"USD_Disbursement"');
          const longDescriptionIndex = headers.indexOf('"LongDescription"');

          // Split rows into columnes
          rows.forEach((row) => {
            const columns = row.split("|");

            // Cell values
            const yearValue = columns[yearIndex];
            const donorNameValue = columns[donorNameIndex];
            const usdDisbursementValue = parseFloat(
              columns[usdDisbursementIndex]
            );
            const longDescriptionValue = columns[longDescriptionIndex];

            console.log(
              yearValue,
              donorNameValue,
              usdDisbursementValue,
              longDescriptionValue
            );
          });
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  console.log(selectedFile);

  return (
    <div>
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
      {selectedFile && <button onClick={readFileContent}>Read file</button>}
    </div>
  );
};

export default LoadCrsFile;
