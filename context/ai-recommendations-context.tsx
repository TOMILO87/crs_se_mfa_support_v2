import React, { createContext, useContext, useState, ReactNode } from "react";

interface AiRecommendationsContextProps {
  selectedField: string | undefined;
  setSelectedField: React.Dispatch<React.SetStateAction<string | undefined>>;
  keywords: string[] | undefined;
  setKeywords: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  trainingData: string[] | undefined;
  setTrainingData: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  testData: string[] | undefined;
  setTestData: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  keywordData: string[] | undefined;
  setKeywordData: React.Dispatch<React.SetStateAction<string[] | undefined>>;
}

const AiRecommendationsContext = createContext<
  AiRecommendationsContextProps | undefined
>(undefined);

export const AiRecommendationsContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [selectedField, setSelectedField] = useState<string | undefined>();
  const [keywords, setKeywords] = useState<string[] | undefined>();
  const [trainingData, setTrainingData] = useState<string[] | undefined>();
  const [testData, setTestData] = useState<string[] | undefined>();
  const [keywordData, setKeywordData] = useState<string[] | undefined>();

  return (
    <AiRecommendationsContext.Provider
      value={{
        selectedField,
        setSelectedField,
        keywords,
        setKeywords,
        trainingData,
        setTrainingData,
        testData,
        setTestData,
        keywordData,
        setKeywordData,
      }}
    >
      {children}
    </AiRecommendationsContext.Provider>
  );
};

export const useAiRecommendationsContext = () => {
  const context = useContext(AiRecommendationsContext);
  if (context === undefined) {
    throw new Error(
      "useAiRecommendationsContext must be used within an AiRecommendationsContextProvider"
    );
  }
  return context;
};
