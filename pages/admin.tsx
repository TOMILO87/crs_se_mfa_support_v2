// Train and save in public folder for easy access

import LoadFile from "@/components/load-file";
import { SelectedFileContextProvider } from "@/context/selected-file-context";
import styles from "@/styles/admin.module.css";
import FieldSelector from "@/components/ai-recommendations/field-selector";
import IdentifyKeywords from "@/components/ai-recommendations/identify-keywords";
import { AiRecommendationsContextProvider } from "@/context/ai-recommendations-context";

export default function AiTrainier() {
  return (
    <main className={styles.admin}>
      <SelectedFileContextProvider>
        <h1>Wellcome to the admin page!</h1>
        <h1>Upload file</h1>
        <h1>Train AI recommendations</h1>
        <AiRecommendationsContextProvider>
          <LoadFile />
          <FieldSelector />
          <IdentifyKeywords />
          //Rest bottom
        </AiRecommendationsContextProvider>
        <h2>Calculate country aggregates</h2>
        <h3>Directly allocated</h3>
        <h3>Imputed multilateral</h3>
        <h3>Imputed regional</h3>
        <h3>Imputed global</h3>
        <h2>Calculate thematics aggregates</h2>
        <h3>Directly allocated</h3>
        <h3>Imputed multilateral</h3>
        <h3>Imputed regional</h3>
        <h3>Imputed global</h3>
      </SelectedFileContextProvider>
    </main>
  );
}
