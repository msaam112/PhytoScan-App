import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function loadTomatoModel() {
  try {
    // 1. Initialize TensorFlow.js
    await tf.ready();

    // 2. Load the model using expo-asset
    const modelAsset = Asset.fromModule(require('../../assets/model/tomato_disease_model.tflite'));
    await modelAsset.downloadAsync();
    const modelPath = modelAsset.localUri;

    if (!modelPath) {
      throw new Error('Model file not found!');
    }

    // 3. Load TFLite model
    const model = await tflite.loadTFLiteModel(modelPath);
    console.log('✅ Model loaded successfully!');
    return model;

  } catch (error) {
    console.error('❌ Error loading model:', error);
    throw error;
  }
}
