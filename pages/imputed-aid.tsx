import IdentifyKeywords from "@/.next/OLD/identify-keywords";
import LoadCrsFile from "@/.next/OLD/load-crs-file";
import LoadCrsFileV2 from "@/.next/OLD/load-crs-file-v2";
import LoadCrsFileV3 from "@/.next/OLD/load-crs-file-v3";
import LoadCrsFileV4 from "@/.next/OLD/load-crs-file-v4";
import ModelTrainer from "@/.next/OLD/model-trainer";
import styles from "@/styles/lab.module.css";

export default function Imputed() {
  return (
    <>
      <main className={styles.lab}>
        <h1>Calculate imputed aid</h1>
        <LoadCrsFileV4 />
      </main>
    </>
  );
}
