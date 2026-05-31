/**
 * Image generation helper using Replicate (Flux Schnell)
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 */
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  const apiKey = ENV.replicateApiKey || process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY is not configured");
  }

  const fullPrompt = options.prompt;

  const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: fullPrompt,
        num_outputs: 1,
        output_format: "webp",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Replicate image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`,
    );
  }

  const result = (await response.json()) as {
    output?: string[];
    id?: string;
    status?: string;
  };

  if (result.output && result.output.length > 0) {
    return { url: result.output[0] };
  }

  // If not immediately ready (no "wait" support or async), poll for result
  if (result.id && result.status && result.status !== "succeeded") {
    return await pollReplicateResult(apiKey, result.id);
  }

  throw new Error("Replicate returned no image URL");
}

async function pollReplicateResult(apiKey: string, predictionId: string, maxAttempts = 30): Promise<GenerateImageResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });
    if (!response.ok) continue;
    const data = (await response.json()) as { status?: string; output?: string[] };
    if (data.status === "succeeded" && data.output && data.output.length > 0) {
      return { url: data.output[0] };
    }
    if (data.status === "failed") {
      throw new Error("Replicate image generation failed");
    }
  }
  throw new Error("Replicate image generation timed out");
}
