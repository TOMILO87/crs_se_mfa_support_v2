import ModelPredictor from "@/components/ai-recommendations/model-predictor";
import { AiRecommendationsContextProvider } from "@/context/ai-recommendations-context";

export default function AiRecommender() {
  return (
    <main>
      <AiRecommendationsContextProvider>
        <ModelPredictor />
      </AiRecommendationsContextProvider>
    </main>
  );
}
