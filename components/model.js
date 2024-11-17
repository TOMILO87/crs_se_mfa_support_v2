import * as tf from "@tensorflow/tfjs";

const Model = () => {
  // Load the model
  const loadModel = async () => {
    try {
      const model = await tf.loadLayersModel("/models/Gender_model/model.json"); // This is the path to the converted model
      console.log("Model loaded:", model);

      // Log the model summary (optional for debugging)
      model.summary();

      return model;
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  // Call the loadModel function
  loadModel();

  return null;
};

export default Model;
