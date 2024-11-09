import { useSelectedFileContext } from "@/context/selected-file-context";

const LoadFile: React.FC = () => {
  const { setSelectedFile } = useSelectedFileContext();

  const fileInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div>
      <label htmlFor="fileInput">
        <input
          type="file"
          id="fileInput"
          accept=".txt, .csv"
          onChange={fileInputHandler}
        />
      </label>
    </div>
  );
};

export default LoadFile;
