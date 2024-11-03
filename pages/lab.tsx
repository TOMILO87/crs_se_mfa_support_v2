import IdentifyKeywords from "@/.next/OLD/identify-keywords";
import ModelTrainer from "@/.next/OLD/model-trainer";
import styles from "@/styles/lab.module.css";

// Connect to github

export default function Lab() {
  const marker = '"Gender"';

  return (
    <>
      <main className={styles.lab}>
        <h1>Wellcome to the lab!</h1>
        <h2>Identify keywords</h2>
        <div className={styles["identify-keywords"]}>
          <IdentifyKeywords marker={marker} />
        </div>
        <h2>Train model</h2>
        <div className={styles["model-trainer"]}>
          <ModelTrainer X={"X"} Y={"Y"} />
        </div>
      </main>
    </>
  );
}

/*
Does not work for some reason
<Head>
        <title>The lab (secret place)</title>
        <meta name="description" content="Lab where we train AI models" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
*/
