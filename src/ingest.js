import fs from "fs";
import { storeChunk, clearCollection } from "./vectorStore.js";

// split text into overlapping chunks
function chunkText(text, chunkSize = 200, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
  }

  return chunks;
}

async function ingest() {
  console.log("Starting document ingestion...\n");

  // read the document
  const text = fs.readFileSync("./data/document.txt", "utf-8");
  console.log(`Document loaded: ${text.length} characters`);

  // split into chunks
  const chunks = chunkText(text);
  console.log(`Split into ${chunks.length} chunks\n`);

  // clear old data
  await clearCollection();

  // store each chunk
  for (let i = 0; i < chunks.length; i++) {
    await storeChunk(`chunk_${i}`, chunks[i]);
    console.log(`✅ Stored chunk ${i + 1}/${chunks.length}`);
  }

  console.log("\nIngestion complete! Your document is now searchable.");
}

ingest();