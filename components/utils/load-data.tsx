import React, { useState } from "react";
import { useSelectedFileContext } from "@/context/selected-file-context";

const LoadData: React.FC = () => {
  const { setSelectedFile } = useSelectedFileContext();
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [combinedData, setCombinedData] = useState<any[]>([]);
  const [filesToProcess, setFilesToProcess] = useState<FileList | null>(null);

  console.log(combinedData);

  const handleFiles = async (files: FileList) => {
    setFilesToProcess(files);

    // Parse headers from the first file only
    const fileContent = await files[0].text();
    const lines = fileContent.split("\n");
    const fileHeaders = lines[0]
      ?.split("|")
      .map((header) => header.trim().replace(/\"/g, ""));

    if (fileHeaders) {
      setHeaders(fileHeaders);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const toggleColumnSelection = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const processData = async () => {
    if (!filesToProcess || selectedColumns.length === 0) return;

    let allRows: any[] = [];

    for (const file of Array.from(filesToProcess)) {
      const fileContent = await file.text();
      const lines = fileContent.split("\n");
      const fileHeaders = lines[0]
        ?.split("|")
        .map((header) => header.trim().replace(/\"/g, ""));

      if (fileHeaders) {
        // Process data in smaller batches
        const BATCH_SIZE = 1000;
        for (let i = 1; i < lines.length; i += BATCH_SIZE) {
          const batch = lines.slice(i, i + BATCH_SIZE).map((line) =>
            line.split("|").reduce((acc, value, index) => {
              const column = fileHeaders[index].replace(/\"/g, ""); // Clean up header names
              if (selectedColumns.includes(column)) {
                acc[column] = value.trim();
              }
              return acc;
            }, {} as Record<string, string>)
          );

          // Filter out empty rows and add batch to allRows
          allRows = allRows.concat(
            batch.filter((row) => Object.keys(row).length > 0)
          );
        }
      }
    }

    setCombinedData(allRows);

    // Create a JSON file from the combined data and update `setSelectedFile`
    const combinedDataBlob = new Blob([JSON.stringify(allRows)], {
      type: "application/json",
    });
    const combinedDataFile = new File(
      [combinedDataBlob],
      "combinedDataset.json",
      { type: "application/json" }
    );
    setSelectedFile(combinedDataFile);
  };

  const getRandomRows = (data: any[], count: number) => {
    // Shuffle and slice to get random rows
    const shuffled = data.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        border: "2px dashed #aaa",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <p>Drag and drop files here, or click to select</p>

      {headers.length > 0 && (
        <div>
          <h3>Select Columns to Keep:</h3>
          {headers.map((header) => (
            <label key={header}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(header)}
                onChange={() => toggleColumnSelection(header)}
              />
              {header}
            </label>
          ))}
          <button onClick={processData}>Confirm Selection</button>
        </div>
      )}

      {combinedData.length > 0 && (
        <div>
          <h3>Sample Combined Dataset (10 Random Rows):</h3>
          <pre>{JSON.stringify(getRandomRows(combinedData, 10), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default LoadData;
