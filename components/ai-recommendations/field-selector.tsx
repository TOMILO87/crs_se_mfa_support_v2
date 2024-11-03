import { useAiRecommendationsContext } from "@/context/ai-recommendations-context";

const FieldSelector = () => {
  const { selectedField, setSelectedField } = useAiRecommendationsContext();

  // Options for 'field' dropdown
  const fieldOptions = [
    "Gender",
    "Environment",
    "Climate change mitigation",
    "Climate change adaptation",
  ];

  // Handle selecting a field
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedField(e.target.value);
  };

  return (
    <div className="scroll-list-container">
      {/* Field Scroll List */}
      <label htmlFor="field">
        <select
          id="field"
          value={selectedField || ""}
          onChange={handleFieldChange}
        >
          {!selectedField && <option value="">-- Choose a Field --</option>}
          {fieldOptions.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default FieldSelector;
