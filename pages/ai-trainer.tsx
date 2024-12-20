// Train and save in public folder for easy access
// </AiRecommendationsContextProvider>

import FieldSelector from "@/components/ai-recommendations/field-selector";
import LoadFile from "@/components/utils/load-file";
import { SelectedFileContextProvider } from "@/context/selected-file-context";
import { AiRecommendationsContextProvider } from "@/context/ai-recommendations-context";
import styles from "@/styles/admin.module.css";
import ModelTrainer from "@/components/ai-recommendations/model-trainer";
import ModelTester from "@/components/ai-recommendations/model-tester";
//import ModelTrainer from "@/components/ai-recommendations/model-trainer";
//import SplitData from "@/OLD/js extract keywords/split-data";
//import LoadData from "@/components/utils/load-data";
//import ModelTrainerV2 from "@/OLD/ai-recommendations-v2/model-trainer";

//<ModelTrainer />
///////////////
//          <LoadData />

//<h2>Select file</h2>
//          <LoadFile />
//          <h2>Split data</h2>
//          <SplitData />

//<IdentifyKeywords />

export default function AiTrainier() {
  return (
    <main className={styles.admin}>
      <SelectedFileContextProvider>
        <h1>AI trainer page</h1>
        <AiRecommendationsContextProvider>
          <h2>Identify keywords</h2>
          <FieldSelector />
          <h2>Train model</h2>
          <ModelTrainer />
          <ModelTester />
        </AiRecommendationsContextProvider>
      </SelectedFileContextProvider>
    </main>
  );
}
