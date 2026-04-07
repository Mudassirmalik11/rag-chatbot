# RAG Chatbot

This repository contains a simple Retrieval-Augmented Generation (RAG) chatbot built with Node.js, Express, ChromaDB, Xenova Transformers embeddings, and the Groq LLM API.

## Project Overview

The chatbot answers questions using information stored in a document (`data/document.txt`). It does not invent answers outside the provided document. Instead, it:

1. Converts the user's question into search embeddings.
2. Retrieves relevant document chunks from a vector store.
3. Builds a prompt with the retrieved context.
4. Sends the prompt to the Groq language model.
5. Streams the generated answer back to the browser.

## Folder Structure

- `server.js` - Express web server and chat endpoint.
- `src/rag.js` - Main RAG logic: search + prompt building + Groq chat completion.
- `src/vectorStore.js` - ChromaDB vector store management.
- `src/embedder.js` - Embedding function using `@xenova/transformers`.
- `src/ingest.js` - Document ingestion script.
- `data/document.txt` - Text document containing the knowledge base.
- `public/index.html` - Frontend chat UI.
- `package.json` - Node.js dependencies.

## How It Works

### 1. User Request

The frontend sends a POST request to `/chat` with JSON:

```json
{
  "question": "What services do you offer?",
  "history": []
}
```

This request hits `server.js`.

### 2. Express Server

In `server.js`:

- `app.use(express.json())` parses incoming JSON.
- `app.post('/chat', ...)` receives the chat request.
- The endpoint sets SSE headers so the response can stream text to the browser.
- It calls `ragAnswer(question, history)`.

### 3. RAG Answer Flow

In `src/rag.js`:

- `searchChunks(question, 3)` is called to find the most relevant document chunks.
- Found chunks are joined into a single `context` string.
- A `systemPrompt` is built telling the assistant to answer only from that context and to fallback to a contact message if the answer is not available.
- The prompt, chat history, and user question are sent to `groq.chat.completions.create()`.
- The response is streamed back to `server.js`.

### 4. Streaming Response

`server.js` receives the streamed model output and forwards it to the client in Server-Sent Events format:

- Each chunk is sent as `data: {"text":"..."}`
- After the stream ends, it sends `data: {"done": true}`

This allows the browser to display the answer as it arrives.

### 5. Vector Search

In `src/vectorStore.js`:

- `getCollection()` connects to ChromaDB and returns the collection.
- `storeChunk()` adds text chunks to Chroma with embeddings.
- `searchChunks()` queries the collection for the most relevant chunks.

> Note: In the current local test setup, the real ChromaDB connection may be unstable. To keep the app testable, `searchChunks()` can be replaced with a hardcoded fallback that returns static document snippets.

### 6. Embeddings

In `src/embedder.js`:

- `pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')` loads the embedding model.
- The `embed(text)` function computes normalized vector embeddings.

## Ingestion Process

The ingestion script `src/ingest.js` does this:

1. Reads `data/document.txt`.
2. Splits the text into overlapping chunks (`chunkSize = 200`, `overlap = 50`).
3. Clears the old Chroma collection.
4. Stores each chunk with an embedding.

This prepares the knowledge base for semantic search.

## Running the Project

### Quick Start (Windows PowerShell)

```powershell
cd "C:\Users\Mudassir Malik\Desktop\learning Agent\rag-chatbot"
npm install

# Start ChromaDB in a separate terminal window
chroma run --host localhost --port 8000 --path ./chroma

# In another terminal, ingest the document
node src/ingest.js

# Start the chatbot server
node server.js
```

### 1. Install dependencies

```bash
cd rag-chatbot
npm install
```

### 2. Start ChromaDB

A local Chroma server is required for vector search. Example command:

```bash
chroma run --host localhost --port 8000 --path ./chroma
```

If that fails, the app can still run in fallback mode with a static `searchChunks()` implementation.

### 3. Ingest the document

```bash
node src/ingest.js
```

### 4. Start the server

```bash
node server.js
```

### 5. Open the frontend

Open `public/index.html` in a browser, or visit:

```
http://localhost:3000
```

## API Endpoint

- `POST /chat`
- Request body:
  - `question` - user question text
  - `history` - chat history array, e.g. `[{ role: 'user', content: '...' }]`
- Response: streamed Server-Sent Events with `text` chunks and a final `done` signal.

## Why It Said "I don't have that information"

The assistant is explicitly instructed in `src/rag.js` to answer only from the provided context. If the vector search did not return chunks containing pricing details, the prompt tells the model to reply with the fallback message.

That means the behavior is correct for the current architecture; the actual fix is to ensure the search returns the correct document chunks or to ingest the document successfully.

## Notes for Beginner Developers

- The RAG pattern is built from two parts: retrieval and generation.
- The retrieval step finds document fragments related to the question.
- The generation step asks the language model to answer using only those fragments.
- If retrieval fails or returns incomplete context, the model may correctly say it does not have the information.
- Real-world RAG systems often include more robust chunking, better prompt design, and search result scoring.

## Troubleshooting

- If `ChromaConnectionError` appears, verify the local Chroma server is running on port `8000`.
- Ensure `chroma run` is started in the same folder and that the path exists.
- If the frontend streams nothing, check the SSE headers in `server.js`.
- If the model answer is wrong, examine the prompt and the document chunks returned by `searchChunks()`.

## Summary

This project is a beginner-friendly RAG chatbot that combines:

- a document knowledge base,
- embeddings for semantic search,
- ChromaDB for vector storage,
- a Groq language model for answer generation,
- and an Express server to connect everything.

If you want, I can also add a `README` section with exact debugging commands for Windows PowerShell.