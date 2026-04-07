import { ChromaClient  } from "chromadb";
import { embed } from "./embedder.js";

// Retry logic for Chroma connection
async function connectToChroma() {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = new ChromaClient({ 
        host: "localhost", 
        port: 8000,
      });
      // Test connection
      await client.heartbeat();
      console.log("✅ Connected to Chroma server");
      return client;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      console.log(`⏳ Retrying Chroma connection... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

let clientPromise = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = connectToChroma();
  }
  return clientPromise;
}

const COLLECTION_NAME = "rag_documents";

// get or create collection
export async function getCollection() {
  const client = await getClient();
  return await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction: {
      generate: async (texts) => Promise.all(texts.map(embed)),
    },
  });
}

// store a chunk of text with an id
export async function storeChunk(id, text) {
  try {
    const collection = await getCollection();
    const embedding = await embed(text);

    await collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [text],
    });
  } catch (error) {
    console.error(`Error storing chunk ${id}:`, error.message);
    // Retry once if connection fails
    if (error.message.includes("ChromaConnectionError")) {
      clientPromise = null; // Reset connection
      const collection = await getCollection();
      const embedding = await embed(text);
      await collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [text],
      });
    } else {
      throw error;
    }
  }
}

// search for most relevant chunks for a query
export async function searchChunks(query, nResults = 3) {
  // Dummy implementation for testing
  return [
    "We offer three main services: 1. AI Chatbot Development — custom chatbots for businesses starting at Rs.25,000 2. Web Development — professional websites starting at Rs.15,000 3. AI Automation — workflow automation starting at Rs.40,000",
    "Our process has 4 steps: Discovery call, Proposal, Development, Final delivery."
  ];
}

// clear collection (useful when re-ingesting)
export async function clearCollection() {
  try {
    const client = await getClient();
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log("Collection cleared.");
  } catch (e) {
    console.log("No existing collection to clear.");
  }
}
