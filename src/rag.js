import Groq from "groq-sdk";
import dotenv from "dotenv";
import { searchChunks } from "./vectorStore.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function ragAnswer(question, chatHistory = []) {

  // Step 1: search vector DB for relevant chunks
  console.log(`\nSearching docs for: "${question}"`);
  const relevantChunks = await searchChunks(question, 3);
  const context = relevantChunks.join("\n\n");
  console.log(`Found ${relevantChunks.length} relevant chunks`);

  // Step 2: build prompt with context injected
  const systemPrompt = `
You are a helpful assistant for TechSolutions PK.
Answer questions ONLY based on the context provided below.
If the answer is not in the context, say "I don't have that information. 
Please contact us at hello@techsolutionspk.com"
Be concise, friendly and professional.

CONTEXT FROM DOCUMENTS:
${context}
`;

  // Step 3: send to Groq with context + chat history
  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: question }
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.3,  // low temp = more factual, stays close to document
    max_tokens: 300,
    stream: true
  });

  return response; // return stream
}