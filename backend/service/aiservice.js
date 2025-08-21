// service/aiservice.js
// -------------------------------
// 1) Load env + import SDK
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// 2) Create the client with your API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 3) Model choice (easy to swap)
const MODEL = "gemini-2.5-flash";

// 4) Optional quick self-test to verify the key works
async function main() {
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: "Say hi in 3 words",
    });
    console.log("🤖 Test response:", res.text);
  } catch (e) {
    // don’t crash the app if the test fails
    console.warn("⚠️ Gemini self-test skipped/failed:", e?.message || e);
  }
}
main();

// 5) Tiny validator: ensure parts[].text is always a string
function isValidHistory(history) {
  return Array.isArray(history) && history.every(
    m =>
      (m.role === "user" || m.role === "model") &&
      Array.isArray(m.parts) &&
      m.parts.length > 0 &&
      typeof m.parts[0]?.text === "string"
  );
}

// 6) Generate a reply using full chat history
export async function generateResponse(chatHistory) {
  if (!isValidHistory(chatHistory)) {
    throw new Error("chatHistory must be [{ role: 'user'|'model', parts: [{ text: string }] }, ...]");
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: chatHistory,
  });

  return response.text; // plain text from Gemini
}

// 7) (Optional) Single-prompt helper when you don’t need history
export async function generateFromPrompt(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: String(prompt ?? ""),
  });
  return response.text;
}

export default ai;