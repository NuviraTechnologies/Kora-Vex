import { z } from "zod";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { generateImage } from "./_core/imageGeneration";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { KORA_VEX_SYSTEM_PROMPT, getSystemPromptForMode } from "./vex-prompt";

// Alien news headlines — Vex-style sarcastic takes
export const ALIEN_HEADLINES = [
  "BREAKING: Humans Still Arguing About Whether Aliens Exist — Alien Watching From Orbit",
  "EXCLUSIVE: Area 51 Janitor Reveals 'The Smell Is Definitely Not Human'",
  "REPORT: Earth's WiFi Speed Ranked Last In Milky Way For 47th Consecutive Year",
  "SCIENTISTS BAFFLED: Crop Circle Spells 'USE BETTER FERTILIZER' In Zeta Script",
  "PENTAGON CONFIRMS: UAP Videos Are Real, Refuses To Explain Why They Were Watching",
  "STUDY: 94% Of Humans Would Not Survive First Contact — Vex Unsurprised",
  "GALACTIC FEDERATION MEMO: Earth Put On 'Do Not Disturb' List Until Further Notice",
  "ROSWELL 1947: New Documents Reveal Crash Was Actually A Parking Violation",
  "BOB LAZAR VINDICATED AGAIN — Mainstream Science Still Pretending Not To Notice",
  "PLEIADIAN COUNCIL ISSUES STATEMENT: 'We Are Not Your Spirit Guides, Stop Calling'",
  "ANCIENT EGYPTIANS BUILT PYRAMIDS WITH ALIEN TECH — Aliens Annoyed They Got No Credit",
  "NIBIRU STILL NOT HERE — Annunaki Cited 'Traffic' As Reason For 3,600-Year Delay",
  "HUMANS DISCOVER DARK MATTER EXISTS — Aliens Discovered It 4 Million Years Ago",
  "MANTIS BEINGS DENY INVOLVEMENT In Recent String Of Cattle Incidents",
  "TYPE I CIVILIZATION STATUS: Earth Still 27% Away — Vex Bets On 300 More Years",
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Main chat endpoint — supports text and image vision
  chat: router({
    sendMessage: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          mode: z.string().optional().default("normal"),
          imageUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const systemPrompt = getSystemPromptForMode(input.mode);

        // Build the last user message — may include an image
        const lastUserMsg = input.messages[input.messages.length - 1];
        const historyWithoutLast = input.messages.slice(0, -1);

        const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "high" } }> = [];

        if (input.imageUrl) {
          userContent.push({ type: "image_url", image_url: { url: input.imageUrl, detail: "high" } });
          userContent.push({ type: "text", text: lastUserMsg?.content || "What do you see in this image?" });
        }

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string | typeof userContent }> = [
          { role: "system", content: systemPrompt },
          ...historyWithoutLast.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        if (input.imageUrl && userContent.length > 0) {
          messages.push({ role: "user", content: userContent });
        } else if (lastUserMsg) {
          messages.push({ role: "user", content: lastUserMsg.content });
        }

        const result = await invokeLLM({ messages } as Parameters<typeof invokeLLM>[0]);

        const rawContent = result?.choices?.[0]?.message?.content;
        const content =
          typeof rawContent === "string"
            ? rawContent
            : Array.isArray(rawContent)
            ? rawContent
                .filter((p: { type: string }) => p.type === "text")
                .map((p: { type: string; text?: string }) => p.text ?? "")
                .join("")
            : "My neural transmitter is experiencing interference. Try again, human.";

        return { content };
      }),

    // Upload image to S3, return public URL for vision
    uploadImage: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.includes("png") ? "png" : "jpg";
        const key = `vex-uploads/img-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),

    // Upload audio to S3, transcribe via Whisper, return text
    transcribeVoice: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string().default("audio/m4a"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.includes("webm") ? "webm" : input.mimeType.includes("wav") ? "wav" : "m4a";
        const key = `vex-audio/voice-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        const result = await transcribeAudio({ audioUrl: url, language: "en" });
        if ("error" in result) {
          throw new Error(result.error);
        }
        return { text: result.text };
      }),

    // Get rotating alien headlines
    getHeadlines: publicProcedure.query(() => {
      return { headlines: ALIEN_HEADLINES };
    }),

    // Premium TTS — Microsoft Edge Neural Voice (en-US-GuyNeural)
    // Returns base64 MP3 audio of Vex speaking the given text
    tts: publicProcedure
      .input(
        z.object({
          text: z.string().max(2000),
          voice: z.string().default("en-US-GuyNeural"),
        })
      )
      .mutation(async ({ input }) => {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(input.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vex-tts-"));
        try {
          await tts.toFile(tmpDir, input.text);
          const audioPath = path.join(tmpDir, "audio.mp3");
          const audioBuffer = fs.readFileSync(audioPath);
          const base64 = audioBuffer.toString("base64");
          return { base64, mimeType: "audio/mpeg" };
        } finally {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        }
      }),

    // Upload a file (PDF, text, doc) and have Vex analyze it
    uploadFile: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          mimeType: z.string(),
          fileName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.fileName.split(".").pop() ?? "bin";
        const key = `vex-files/file-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        // Extract text content for analysis
        let textContent = "";
        if (input.mimeType === "text/plain" || ext === "txt" || ext === "md" || ext === "csv") {
          textContent = buffer.toString("utf-8").slice(0, 8000);
        }
        return { url, textContent, fileName: input.fileName };
      }),

    // AI Image Generation — Vex draws anything the user asks for
    generateImage: publicProcedure
      .input(
        z.object({
          prompt: z.string().max(500),
          style: z.string().default("cosmic alien art, neon green and black, cyberpunk sci-fi style"),
        })
      )
      .mutation(async ({ input }) => {
        const fullPrompt = `${input.prompt}, ${input.style}`;
        const result = await generateImage({ prompt: fullPrompt });
        return { url: result.url ?? "" };
      }),
  }),
});

export type AppRouter = typeof appRouter;
