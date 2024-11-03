import IdentifyKeywords from "@/components/OLD/identify-keywords";
import LoadCrsFile from "@/components/OLD/load-crs-file";
import LoadCrsFileV2 from "@/components/OLD/load-crs-file-v2";
import LoadCrsFileV3 from "@/components/OLD/load-crs-file-v3";
import LoadCrsFileV4 from "@/components/OLD/load-crs-file-v4";
import ModelTrainer from "@/components/OLD/model-trainer";
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
