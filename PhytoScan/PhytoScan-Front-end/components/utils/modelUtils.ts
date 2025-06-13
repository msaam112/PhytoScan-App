import * as ort from 'onnxruntime-react-native';

// Temporary types for InferenceSession and Tensor
type InferenceSession = any;  // Workaround for missing InferenceSession type
type Tensor = any;  // Workaround for missing Tensor type

// Function to load the ONNX model
export async function loadModel() {
  try {
    // Load the ONNX model from assets (or your specified path)
    const session: InferenceSession = await ort.InferenceSession.create('assets/model/phyto_scan.onnx');
    return session;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
}

// Function to make a prediction with the model
export async function predictWithModel(session: InferenceSession, inputTensor: Tensor) {
  try {
    const feeds = { input: inputTensor }; // Your input tensor
    const results = await session.run(feeds); // Run the model with the provided tensor
    return results.output.data; // Process and return the output data
  } catch (error) {
    console.error('Error during prediction:', error);
    throw error;
  }
}
