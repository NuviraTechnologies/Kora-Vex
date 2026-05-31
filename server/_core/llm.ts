/**
 * LLM module — powered by Moonshot Kimi API.
 * No Manus credits. No Anthropic. Direct API.
 */

import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type MessageContent = string | TextContent | ImageContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
};

export type InvokeParams = {
  messages: Message[];
  model?: string;
  max_tokens?: number;
  maxTokens?: number;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string;
    };
    finish_reason: string | null;
  }>;
};

function getApiKey(): string {
  const key = ENV.moonshotApiKey || process.env.MOONSHOT_API_KEY || "";
  if (!key) {
    throw new Error("MOONSHOT_API_KEY is not configured. Set it in your environment variables.");
  }
  return key;
}

/**
 * Convert messages to Moonshot (OpenAI-compatible) format.
 */
function convertToMoonshotMessages(messages: Message[]): {
  system: string;
  msgs: Array<{ role: "system" | "user" | "assistant"; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
} {
  let system = "";
  const msgs: Array<{ role: "system" | "user" | "assistant"; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      system = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      continue;
    }

    if (typeof msg.content === "string") {
      msgs.push({ role: msg.role as "user" | "assistant", content: msg.content });
    } else if (Array.isArray(msg.content)) {
      const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      for (const item of msg.content) {
        if (typeof item === "string") {
          parts.push({ type: "text", text: item });
        } else if (item.type === "text") {
          parts.push({ type: "text", text: item.text });
        } else if (item.type === "image_url" && item.image_url?.url) {
          parts.push({ type: "image_url", image_url: { url: item.image_url.url } });
        }
      }
      msgs.push({ role: msg.role as "user" | "assistant", content: parts });
    }
  }

  return { system, msgs };
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = getApiKey();
  const { system, msgs } = convertToMoonshotMessages(params.messages);
  const maxTokens = params.max_tokens ?? params.maxTokens ?? 2048;

  const allMessages = system ? [{ role: "system" as const, content: system }, ...msgs] : msgs;

  const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model ?? "moonshot-v1-8k",
      messages: allMessages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Moonshot API request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as {
    id: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      message: { role: string; content: string };
      finish_reason: string | null;
    }>;
  };

  return {
    id: data.id,
    created: data.created,
    model: data.model,
    choices: data.choices.map((c) => ({
      index: c.index,
      message: {
        role: c.message.role as Role,
        content: c.message.content,
      },
      finish_reason: c.finish_reason,
    })),
  };
}
