export async function readWords(): Promise<string[]> {
  const response = await fetch("/key_words.txt");
  const text = await response.text();
  return text
    .split("\n")
    .map((word) => word.trim())
    .filter((word) => word !== "");
}
