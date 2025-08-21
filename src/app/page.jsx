"use client"; // needed for browser-side code

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// connect once when the component mounts
const socket = io("http://localhost:4020", {
  withCredentials: true,
});

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // listener: plain chat echo
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, { from: "user", text: msg }]);
    });

    // listener: AI replies
    socket.on("ai-message:reply", (reply) => {
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    });

    // listener: errors
    socket.on("ai-message:error", (err) => {
      setMessages((prev) => [...prev, { from: "system", text: err }]);
    });

    return () => {
      socket.off("message");
      socket.off("ai-message:reply");
      socket.off("ai-message:error");
    };
  }, []);

  // send user message + request AI reply
  const sendMessage = () => {
    if (!input.trim()) return;

    // show the user message locally
    setMessages((prev) => [...prev, { from: "me", text: input }]);

    // 1) broadcast to chat (optional)
    socket.emit("message", input);

    // 2) ask the AI
    socket.emit("ai-message", { prompt: input });

    setInput(""); // clear input
  };

  return (
    <div className="flex flex-col h-screen p-6">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto border p-4 rounded bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${
              m.from === "me"
                ? "text-right text-blue-600"
                : m.from === "ai"
                ? "text-green-600"
                : "text-gray-500"
            }`}
          >
            <strong>{m.from}:</strong> {m.text}
          </div>
        ))}
      </div>

      {/* Input box */}
      <div className="mt-4 flex">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}