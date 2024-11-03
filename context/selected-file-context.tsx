import React, { createContext, useContext, useState, ReactNode } from "react";

interface SelectedFileContextProps {
  selectedFile: File | undefined;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | undefined>>;
}

// 1. Create context with default values
const SelectedFileContext = createContext<SelectedFileContextProps | undefined>(
  undefined
);

// 2. Create provider component
export const SelectedFileContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();

  return (
    <SelectedFileContext.Provider value={{ selectedFile, setSelectedFile }}>
      {children}
    </SelectedFileContext.Provider>
  );
};

// 3. Create a custom hook for easier access
export const useSelectedFileContext = () => {
  const context = useContext(SelectedFileContext);
  if (context === undefined) {
    throw new Error("useSelectedFileContext must be used within a MyProvider");
  }
  return context;
};
