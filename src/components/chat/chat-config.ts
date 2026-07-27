"use client";

import { DefaultChatTransport } from "ai";

export const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

export const CHAT_PROMPT_MAX_LENGTH = 2000;

export const CHAT_SUGGESTIONS = [
  "Summarize Lukas Sorensen's experience in one paragraph.",
  "What is Lukas Sorensen's experience with AI?",
  "Which technologies does Lukas A Sorensen primarily use?",
];
