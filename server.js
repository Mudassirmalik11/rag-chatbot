process.env.TRANSFORMERS_OFFLINE = '0'; 
process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = '1';


import express from "express";
import path from "path";
import dotenv from "dotenv";
import { ragAnswer } from "./src/rag.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.post("/chat", async (req, res) => {
  const { question, history } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const stream = await ragAnswer(question, history);

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

app.listen(3000, () => {
  console.log("RAG Chatbot running at http://localhost:3000");
});

// Export for Vercel serverless
export default app;