// TODO Make into compoents

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

interface RowDataMulti {
  timePeriod: string;
  obsValue: number;
}

const LoadCrsFileV4: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [data, setData] = useState<RowData | RowDataMulti[]>([]); // Store parsed data here
  const [selectedDonor, setSelectedDonor] = useState<string>(""); // Selected donor for dropdown
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("2022");

  // Handle uploaded file
  const fileInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Read file content and parse it
  const readCrsFileContent = () => {
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

          // Columns of interest
          const yearIndex = headers.indexOf('"Year"');
          const donorNameIndex = headers.indexOf('"DonorName"');
          const usdDisbursementIndex = headers.indexOf('"USD_Disbursement"');
          const usdReceivedIndex = headers.indexOf('"USD_Received"');
          const longDescriptionIndex = headers.indexOf('"LongDescription"');
          const flowNameIndex = headers.indexOf('"FlowName"');
          const recipientNameIndex = headers.indexOf('"RecipientName"');

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

  // Read file content and parse it
  const readMultiFileContent = () => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target) {
          const content = e.target.result as string;

          // Split string into rows
          const rows = content.split("\n");
          const headerRow = rows.shift(); // Remove the header row
          const headers = headerRow!.split(",");

          console.log(headers);

          // Columns of interest
          const timePeriodIndex = headers.indexOf("TIME_PERIOD");
          const obsValueIndex = headers.indexOf("OBS_VALUE");

          const parsedData: RowDataMulti[] = rows.map((row) => {
            const columns = row.split(",");

            // Check if valid obs value
            const obsValue = parseFloat(columns[obsValueIndex]);
            const isValidObsValue = !isNaN(obsValue);

            console.log(columns[timePeriodIndex], obsValue);

            return {
              timePeriod: columns[timePeriodIndex],
              usdDisbursement: isValidObsValue ? obsValue : 0,
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
    return data
      .filter((row) => row.donorName === selectedDonor)
      .filter(
        (row) => row.flowName !== "Other Official Flows (non Export Credit)"
      )
      .reduce((sum, row) => sum + row.usdDisbursement, 0);
  };

  // Calculate total disbursement for the selected donor
  const calculateMultiTotalDisbursement = () => {
    return (
      data
        //.filter((row) => row.timePeriod === selectedDonor)
        .reduce((sum, row) => sum + row.obsValue, 0)
    );
  };

  // Calculate total received for the selected donor
  const calculateTotalReceived = () => {
    return data
      .filter((row) => row.donorName === selectedDonor)
      .filter(
        (row) => row.flowName !== "Other Official Flows (non Export Credit)"
      )
      .reduce((sum, row) => sum + row.usdReceived, 0);
  };

  // Calculate net disbursed for the selected donor
  const calculateTotalNet = () => {
    return calculateTotalDisbursement() - calculateTotalReceived();
  };

  // Calculate total disbursement per recipient and percentage of total
  const calculateDisbursementPerRecipient = () => {
    const totalDisbursement = calculateTotalDisbursement();

    const recipientDisbursements = data
      .filter((row) => row.donorName === selectedDonor)
      .filter(
        (row) => row.flowName !== "Other Official Flows (non Export Credit)"
      )
      .reduce((acc, row) => {
        if (!acc[row.recipientName]) {
          acc[row.recipientName] = 0;
        }
        acc[row.recipientName] += row.usdDisbursement;
        return acc;
      }, {} as { [recipientName: string]: number });

    // Calculate percentage per recipient
    return Object.keys(recipientDisbursements).map((recipient) => {
      const disbursement = recipientDisbursements[recipient];
      const percentage = (disbursement / totalDisbursement) * 100;
      return { recipient, disbursement, percentage };
    });
  };

  // Get unique donors for the dropdown
  const uniqueDonors = Array.from(new Set(data.map((row) => row.donorName)));

  return (
    <div>
      <h3>Choose CRS file</h3>
      <label htmlFor="fileInput">
        Upload file:
        <input
          type="file"
          id="fileInput"
          accept=".txt, .csv"
          onChange={fileInputHandler}
        />
      </label>
      {selectedFile && (
        <button onClick={readCrsFileContent}>Read crs file</button>
      )}
      {selectedFile && (
        <button onClick={readMultiFileContent}>Read multi file</button>
      )}

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
              <h4>Disbursement per Recipient (as % of total)</h4>
              <ul>
                {calculateDisbursementPerRecipient().map((entry, index) => (
                  <li key={index}>
                    {entry.recipient}: {entry.disbursement.toLocaleString()}{" "}
                    MUSD ({entry.percentage.toFixed(2)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h4>Obs value multi</h4>
          <p>{calculateMultiTotalDisbursement().toLocaleString()} MUSD</p>
        </div>
      )}
    </div>
  );
};

export default LoadCrsFileV4;
