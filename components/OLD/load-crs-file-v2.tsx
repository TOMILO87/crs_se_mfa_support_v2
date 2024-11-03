import { useState } from "react";

interface RowData {
  year: string;
  donorName: string;
  usdDisbursement: number;
  usdReceived: number;
  longDescription: string;
  flowName: string;
  recipientName: string;
}

const LoadCrsFileV2: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [data, setData] = useState<RowData[]>([]); // Store parsed data here
  const [selectedDonor, setSelectedDonor] = useState<string>(""); // Selected donor for dropdown

  // Handle uploaded file
  const fileInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Read file content and parse it
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

          // Columns of interest
          const yearIndex = headers.indexOf('"Year"');
          const donorNameIndex = headers.indexOf('"DonorName"');
          const usdDisbursementIndex = headers.indexOf('"USD_Disbursement"');
          const usdReceivedIndex = headers.indexOf('"USD_Received"');
          const longDescriptionIndex = headers.indexOf('"LongDescription"');
          const flowNameIndex = headers.indexOf('"FlowName"');
          const recipientNameIndex = headers.indexOf('"RecipientName"');

          console.log(headers);

          const parsedData: RowData[] = rows.map((row) => {
            const columns = row.split("|");

            // Check if valid disbursement and received
            const usdDisbursementValue = parseFloat(
              columns[usdDisbursementIndex]
            );
            const usdReceivedValue = parseFloat(columns[usdReceivedIndex]);
            const isValidReceived = !isNaN(usdReceivedValue);
            const isValidDisbursement = !isNaN(usdDisbursementValue);

            return {
              year: columns[yearIndex],
              donorName: columns[donorNameIndex],
              usdDisbursement: isValidDisbursement ? usdDisbursementValue : 0,
              usdReceived: isValidReceived ? usdReceivedValue : 0,
              longDescription: columns[longDescriptionIndex],
              flowName: columns[flowNameIndex],
              recipientName: columns[recipientNameIndex],
            };
          });

          // Store parsed data in state
          setData(parsedData);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  // Handle donor selection
  const handleDonorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDonor(event.target.value);
  };

  // Calculate total disbursement for the selected donor
  const calculateTotalDisbursement = () => {
    const totalDisbursement = data
      .filter((row) => row.donorName === selectedDonor)
      .filter(
        (row) => row.flowName !== "Other Official Flows (non Export Credit)"
      )
      .reduce((sum, row) => sum + row.usdDisbursement, 0);

    return totalDisbursement;
  };

  // Calculate total received for the selected donor
  const calculateTotalReceived = () => {
    const totalReceived = data
      .filter((row) => row.donorName === selectedDonor)
      .filter(
        (row) => row.flowName !== "Other Official Flows (non Export Credit)"
      )
      .reduce((sum, row) => sum + row.usdReceived, 0);

    return totalReceived;
  };

  // Calculate net disbursed for the selected donor
  const calculateTotalNet = () => {
    return calculateTotalDisbursement() - calculateTotalReceived();
  };

  // Get unique donors for the dropdown
  const uniqueDonors = Array.from(new Set(data.map((row) => row.donorName)));

  // Get unique flowTypes
  const flowName = Array.from(new Set(data.map((row) => row.flowName)));

  console.log(flowName);

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

      {data.length > 0 && (
        <div>
          <h4>Select Donor</h4>
          <select value={selectedDonor} onChange={handleDonorChange}>
            <option value="">Select a donor</option>
            {uniqueDonors.map((donor) => (
              <option key={donor} value={donor}>
                {donor}
              </option>
            ))}
          </select>

          {selectedDonor && (
            <div>
              <h4>Disbursement</h4>
              <p>{calculateTotalDisbursement().toLocaleString()} MUSD</p>
              <h4>Received</h4>
              <p>{calculateTotalReceived().toLocaleString()} MUSD</p>
              <h4>Net disbursement</h4>
              <p>{calculateTotalNet().toLocaleString()} MUSD</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadCrsFileV2;
