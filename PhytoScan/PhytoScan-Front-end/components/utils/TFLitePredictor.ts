import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';
import * as ImageManipulator from 'expo-image-manipulator';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

import labels from '../../assets/labels/labels.json';

const modelAsset = require('../../assets/model/phytoscan.tflite');

let model: tflite.TFLiteModel | null = null;

export async function loadModel() {
  if (model) return model;

  model = await tflite.loadTFLiteModel(modelAsset);
  console.log('✅ TFLite model loaded');
  return model;
}

export async function predictFromUri(uri: string): Promise<{
  label: string;
  confidence: number;
}> {
  const loadedModel = await loadModel();

  const manipulatedImage = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 224, height: 224 } }],
    { base64: true }
  );

  if (!manipulatedImage.base64) {
    throw new Error('Failed to convert image to base64');
  }

  const imageBytes = tf.util.encodeString(manipulatedImage.base64, 'base64').buffer;
  const rawImageTensor = decodeJpeg(new Uint8Array(imageBytes));

  const normalized = tf.div(tf.cast(rawImageTensor, 'float32'), tf.scalar(255));
  const batched = tf.expandDims(normalized, 0); // Shape: [1, 224, 224, 3]

  const output = loadedModel.predict(batched) as tf.Tensor;
  const scores = await output.data(); // Float32Array of class scores

  const maxIndex = scores.indexOf(Math.max(...scores));
  const label = labels[maxIndex];
  const confidence = scores[maxIndex];

  return { label, confidence };
}
