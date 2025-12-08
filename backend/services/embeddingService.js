import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const generateEmbedding = async (text) => {
  try {
    const response = await hf.featureExtraction({
      model: 'BAAI/bge-small-en-v1.5',
      inputs: text
    });

    // Response could be [[...]] or [...]
    let embedding = response;
    if (Array.isArray(response) && Array.isArray(response[0])) {
      embedding = response[0];
    }

    // Convert any nested arrays to flat 1D numeric array if necessary
    if (Array.isArray(embedding) && embedding.some(el => Array.isArray(el))) {
      embedding = embedding.flat(Infinity);
    }

    // Ensure numbers
    embedding = embedding.map(n => Number(n));

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

export const cosineSimilarity = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return -1;
  const minLen = Math.min(a.length, b.length);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < minLen; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return -1;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
};
