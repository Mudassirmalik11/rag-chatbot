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

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing question in request body." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured." });
  }

  try {
    const stream = await ragAnswer(question, history);
    let fullReply = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      fullReply += text;
    }

    return res.json({ text: fullReply });
  } catch (error) {
    console.error("/chat error:", error?.message || error);
    return res.status(500).json({ error: "Unable to generate response." });
  }
});

if (!process.env.VERCEL) {
  app.listen(3000, () => {
    console.log("RAG Chatbot running at http://localhost:3000");
  });
}

// Export for Vercel serverless
export default app;