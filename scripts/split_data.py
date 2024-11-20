# Split data into datsets for training, test and keyword identification

import pandas as pd

# Input and output file paths
input_file = "../data/CRS_combined_data.csv"
output_training = "../data/training_data.csv"
output_test = "../data/test_data.csv"
output_identify_keywords = "../data/identify_keywords_data.csv"

# Proportions for splitting
train_proportion = 0.90
test_proportion = 0.10
identify_keywords_proportion = 0

# Read the combined data
df = pd.read_csv(input_file, dtype=str)  # Load all data as strings

# Shuffle the data
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Calculate sizes for each split
train_size = int(train_proportion * len(df))
test_size = int(test_proportion * len(df))
identify_keywords_size = len(df) - train_size - test_size

# Split the data
train_data = df.iloc[:train_size]
test_data = df.iloc[train_size:train_size + test_size]
identify_keywords_data = df.iloc[train_size + test_size:]

# Save each split to a CSV file
train_data.to_csv(output_training, index=False)
test_data.to_csv(output_test, index=False)
identify_keywords_data.to_csv(output_identify_keywords, index=False)

print(f"Data split and saved: \n- Training data: {output_training} \n- Test data: {output_test} \n- Identify keywords data: {output_identify_keywords}")
