// Train and save in public folder for easy access
// </AiRecommendationsContextProvider>

import FieldSelector from "@/components/ai-recommendations/field-selector";
import IdentifyKeywords from "@/components/ai-recommendations/identify-keywords";
import LoadFile from "@/components/utils/load-file";
import { SelectedFileContextProvider } from "@/context/selected-file-context";
import { AiRecommendationsContextProvider } from "@/context/ai-recommendations-context";
import styles from "@/styles/admin.module.css";
import ModelTrainer from "@/components/ai-recommendations/model-trainer";
import SplitData from "@/components/ai-recommendations/split-data";
import ModelTrainerV2 from "@/components/ai-recommendations-v2/model-trainer";

export default function AiTrainier() {
  //<ModelTrainerV2 />
  return (
    <main className={styles.admin}>
      <SelectedFileContextProvider>
        <h1>AI trainer page</h1>
        <AiRecommendationsContextProvider>
          <h2>Select file</h2>
          <LoadFile />
          <h2>Split data</h2>
          <SplitData />
          <h2>Identify keywords</h2>
          <FieldSelector />
          <IdentifyKeywords />
          <h2>Train model</h2>
          <ModelTrainer />
          //////////
        </AiRecommendationsContextProvider>
      </SelectedFileContextProvider>
    </main>
  );
}
