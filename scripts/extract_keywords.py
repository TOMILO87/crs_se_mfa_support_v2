# Identify keywords for policy markers

import json
import pandas as pd
import random
import time
from typing import List, Set
from stop_words import get_stop_words

# Constants
MAX_CRS_ROWS = 100000  # limited rows during development
MAX_KEYWORDS = 800
BIG_SAMPLE_SIZE = 40
SMALL_SAMPLE_SIZE = 3
TIME_LIMIT_MS = 2 * 1000  # time limit in milliseconds

# Output file to save the combined data
OUTPUT_FILE = "../data/keywords.json"

# Load CSV data
data = pd.read_csv("../data/identify_keywords_data.csv")

# Stopwords in multiple languages
english_stopwords = set(get_stop_words("en"))
french_stopwords = set(get_stop_words("fr"))
spanish_stopwords = set(get_stop_words("es"))
multilingual_stopwords = english_stopwords | french_stopwords | spanish_stopwords

# Helper functions
def preprocess_text(text: str) -> str:
    """Remove stopwords, numbers, special characters, and short/invalid words."""
    text = text.lower().replace(r"[^\w\s]", "").replace(r"\s+", " ")
    text = remove_multilingual_stopwords(text)
    return " ".join(word for word in text.split() if not is_invalid_word(word))

def remove_multilingual_stopwords(text: str) -> str:
    """Remove multilingual stopwords."""
    return " ".join(word for word in text.split() if word not in multilingual_stopwords)

def is_invalid_word(word: str) -> bool:
    """Filter out numbers, single-character words, and Roman numerals."""
    return word.isdigit() or len(word) == 1 or word in {"i", "ii", "iii", "iv", "v"}

# Split data by marker value
def split_data_by_marker(data: pd.DataFrame, max_rows: int, marker_column: str):
    filtered_data = data[[marker_column, "LongDescription", "USD_Disbursement"]].dropna(subset=[marker_column, "LongDescription"])
    value0_data, value12_data = [], []
    
    for _, row in filtered_data.iterrows():
        if len(value0_data) >= max_rows and len(value12_data) >= max_rows:
            break
        description = preprocess_text(row["LongDescription"])
        marker_value = row[marker_column]
        amount_value = row["USD_Disbursement"]
        
        if description and amount_value > 0:
            if marker_value == 0 and len(value0_data) < max_rows:
                value0_data.append(description)
            elif marker_value in [1, 2] and len(value12_data) < max_rows:
                value12_data.append(description)
    return value0_data, value12_data

# Randomly sample from a list
def get_random_samples(array: List[str], sample_size: int) -> List[str]:
    return random.sample(array, min(len(array), sample_size))

# Extract common words from samples
def get_common_words(samples: List[str]) -> List[str]:
    word_sets = [set(sample.split()) for sample in samples if sample]
    return list(set.intersection(*word_sets)) if word_sets else []

# Filter unique words
def filter_unique_words(words: List[str], samples: List[str]) -> List[str]:
    words_in_samples = set(word for sample in samples for word in sample.split())
    return [word for word in words if word not in words_in_samples]

# Identify unique words more common in small sample
def get_unique_words_small(small_value: List[str], big_value: List[str]) -> List[str]:
    sampled_small = get_random_samples(small_value, SMALL_SAMPLE_SIZE)
    sampled_big = get_random_samples(big_value, BIG_SAMPLE_SIZE)
    common_words_small = get_common_words(sampled_small)
    return filter_unique_words(common_words_small, sampled_big)

# Extract keywords distinguishing value 0 and value 1,2
def extract_keywords(value12: List[str], value0: List[str]) -> Set[str]:
    keywords0 = set()
    keywords12 = set()
    start_time = time.time()
    
    while len(keywords0) + len(keywords12) < MAX_KEYWORDS:
        if (time.time() - start_time) * 1000 >= TIME_LIMIT_MS:
            print("Time limit reached, stopping keyword extraction.")
            break
        keywords0.update(get_unique_words_small(value0, value12))
        keywords12.update(get_unique_words_small(value12, value0))

    # Display keywords
    show_keywords(keywords0, keywords12)
    
    # Save keywords to JSON
    keywords_data = list(keywords0) + list(keywords12)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(keywords_data, f, indent=2)
    print("\nKeywords saved to keywords.json")

# Display keywords
def show_keywords(keywords0: Set[str], keywords12: Set[str]):
    print("Keywords for Value 0:")
    print(", ".join(keywords0))
    print("\nKeywords for Value 1, 2:")
    print(", ".join(keywords12))

# Main execution
marker_column = "Gender"  # Column to split by
value0_data, value12_data = split_data_by_marker(data, MAX_CRS_ROWS, marker_column)

extract_keywords(value12_data, value0_data)