# Combine several CRS files into one file

import pandas as pd

# Directory containing the data
INPUT_DIR = "../data/"

# Output file to save the combined data
OUTPUT_FILE = "../data/CRS_combined_data.csv"

# List of columns to extract
COLUMN_NAMES = ["Year", "Gender", "Environment", "USD_Disbursement", "PurposeCode", "LongDescription", "ShortDescription", "ChannelName", "ChannelReportedName"]

# List of years to process
YEARS = ["2018", "2019", "2020", "2021", "2022"]

# Function to map PurposeCode to specified categories
def map_purpose_code(code):
    code_str = str(code)
    if code_str.startswith("11"): return "education"
    elif code_str.startswith("12"): return "health"
    elif code_str.startswith("13"): return "population"
    elif code_str.startswith("14"): return "water"
    elif code_str.startswith("15"): return "government/cso"
    elif code_str.startswith("16"): return "welfare/services"
    elif code_str.startswith("21"): return "transport"
    elif code_str.startswith("22"): return "communications"
    elif code_str.startswith("23"): return "energy"
    elif code_str.startswith("24"): return "finance"
    elif code_str.startswith("25"): return "business"
    elif code_str.startswith("31"): return "agriculture/forestry/fishing"
    elif code_str.startswith("32"): return "industry/mining/construction"
    elif code_str.startswith("33"): return "trade/tourism"
    elif code_str.startswith("41"): return "environment"
    elif code_str.startswith(("72", "73", "74")): return "humanitarian/reconstruction"
    elif code_str.startswith(("43", "5", "6", "9")): return "multisector/budget/unspecified"
    else: return "multisector/budget/unspecified"

# Initialize an empty DataFrame to store the combined data
combined_data = pd.DataFrame()

# Loop over the years
for year in YEARS:
    # File path for the current year's data
    file_path = f"{INPUT_DIR}/CRS {year} data.txt"
    
    # Read the current year's data into a DataFrame with all columns as strings
    df = pd.read_csv(file_path, delimiter='|', quotechar='"', dtype=str)
    
    # Extract the specified columns, filling missing values to avoid NaNs
    df_year = df[COLUMN_NAMES].fillna("")

    # Convert USD_Disbursement to numeric for filtering; rows with invalid entries will be set to NaN
    df_year['USD_Disbursement'] = pd.to_numeric(df_year['USD_Disbursement'], errors='coerce')
    
    # Filter rows where USD_Disbursement > 0
    df_year = df_year[df_year['USD_Disbursement'] > 0]

    # Map PurposeCode to the specified categories
    df_year['Category'] = df_year['PurposeCode'].apply(map_purpose_code)

    # Create a new column that combines the specified description fields into a single string
    df_year['CombinedDescription'] = df_year[['LongDescription', 'ShortDescription', 'ChannelName', 'ChannelReportedName']].agg(' '.join, axis=1)
    
    # Convert all columns back to strings to ensure uniform data type
    df_year = df_year.astype(str)
    
    # Add the data for this year to the combined DataFrame
    combined_data = pd.concat([combined_data, df_year], ignore_index=True)

# Save the combined data to a CSV file
combined_data.to_csv(OUTPUT_FILE, index=False)

print(f"Data combined and saved to {OUTPUT_FILE}")
