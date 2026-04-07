import { pipeline } from "@xenova/transformers";

let embedder = null;

// load model once, reuse it (loading takes a few seconds)
async function getEmbedder() {
  if (!embedder) {
    console.log("Loading embedding model...");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("Embedding model ready.\n");
  }
  return embedder;
}

// convert any text into a vector (array of numbers)
export async function embed(text) {
  const model = await getEmbedder();
  const result = await model(text, {
    pooling: "mean",
    normalize: true
  });
  return Array.from(result.data);
}