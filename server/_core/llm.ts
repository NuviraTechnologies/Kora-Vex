/**
 * LLM module — powered by Anthropic Claude directly.
 * No Manus credits required. Works independently forever.
 */
import Anthropic from "@anthropic-ai/sdk";
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

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!ENV.anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured. Set it in your environment variables.");
    }
    _client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  }
  return _client;
}

/**
 * Convert messages to Anthropic format, extracting system prompt.
 */
function convertToAnthropicMessages(messages: Message[]): {
  system: string;
  msgs: Anthropic.MessageParam[];
} {
  let system = "";
  const msgs: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      system = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      continue;
    }

    if (typeof msg.content === "string") {
      msgs.push({ role: msg.role as "user" | "assistant", content: msg.content });
    } else if (Array.isArray(msg.content)) {
      const blocks: Anthropic.ContentBlockParam[] = [];
      for (const part of msg.content) {
        if (typeof part === "string") {
          blocks.push({ type: "text", text: part });
        } else if (part.type === "text") {
          blocks.push({ type: "text", text: part.text });
        } else if (part.type === "image_url" && part.image_url?.url) {
          const url = part.image_url.url;
          if (url.startsWith("data:")) {
            const [header, data] = url.split(",");
            const mediaType = header.split(":")[1].split(";")[0] as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp";
            blocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
          } else {
            blocks.push({ type: "image", source: { type: "url", url } });
          }
        }
      }
      if (blocks.length > 0) {
        msgs.push({ role: msg.role as "user" | "assistant", content: blocks });
      }
    }
  }

  return { system, msgs };
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const client = getClient();
  const { system, msgs } = convertToAnthropicMessages(params.messages);
  const maxTokens = params.max_tokens ?? params.maxTokens ?? 2048;

  const response = await client.messages.create({
    model: params.model ?? "claude-opus-4-5",
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: msgs,
  });

  const textContent = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    id: response.id,
    created: Date.now(),
    model: response.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: textContent },
        finish_reason: response.stop_reason ?? null,
      },
    ],
  };
}
