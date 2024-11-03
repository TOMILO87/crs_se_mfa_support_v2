/// Ge användaren feedback hur texten kan uppdateras

import LoadCrsFileV4 from "@/.next/OLD/load-crs-file-v4";
import ModelTrainer from "@/.next/OLD/model-trainer";
import styles from "@/styles/lab.module.css";
import { useEffect, useState } from "react";

type markerValue = 0 | 1 | 2;

interface recommendations {
  gender: markerValue;
  adaptation: markerValue;
}

export default function AiRecommendations() {
  const PLACEHOLDER = "Beskriv insatsen på engelska";

  const [recommendations, setRecommendations] = useState<recommendations>();

  useEffect(() => {
    const recommendations = {
      gender: 0 as markerValue,
      adaptation: 0 as markerValue,
    };

    setRecommendations(recommendations);
  }, []);

  const getRecommednations = () => {
    setRecommendations((recommendations) => {
      recommendations.gender = 1;
    });
  };

  console.log(recommendations);

  return (
    <>
      <main className={styles.lab}>
        <h1>Planit recommendations</h1>
        <textarea placeholder={PLACEHOLDER} />
        <button onClick={getRecommednations}>OK</button>
      </main>
    </>
  );
}
