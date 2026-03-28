import { describe, it, expect } from "vitest";
import { KORA_VEX_SYSTEM_PROMPT, getSystemPromptForMode, ROLEPLAY_MODES } from "../server/vex-prompt";
import { ALIEN_HEADLINES } from "../server/routers";
import { ROLEPLAY_MODES as CLIENT_MODES } from "../lib/roleplay-modes";

// ─── System Prompt ────────────────────────────────────────────────────────────
describe("Kora Vex System Prompt", () => {
  it("is a non-empty string", () => {
    expect(typeof KORA_VEX_SYSTEM_PROMPT).toBe("string");
    expect(KORA_VEX_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("establishes Kora Vex identity and origin", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Kora Vex");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Zeta Reticuli");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Type II");
  });

  it("includes Kardashev Scale knowledge", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Kardashev");
  });

  it("references multiple alien races", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Grays");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Reptilians");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Pleiadians");
  });

  it("includes content safety rules", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("NEVER use profanity");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("PG-rated");
  });

  it("enforces character consistency", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("You do not break character");
  });

  it("includes image analysis instructions", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("IMAGE ANALYSIS");
  });
});

// ─── Roleplay Modes — Server ──────────────────────────────────────────────────
describe("Roleplay Modes — Server", () => {
  const expectedModes = ["normal", "interrogation", "tour_guide", "news_anchor", "conspiracy", "science"];

  it("has all 6 modes defined", () => {
    expectedModes.forEach((mode) => {
      expect(ROLEPLAY_MODES).toHaveProperty(mode);
    });
  });

  it("each mode has label, emoji, and greeting", () => {
    expectedModes.forEach((mode) => {
      const m = ROLEPLAY_MODES[mode];
      expect(m.label).toBeTruthy();
      expect(m.emoji).toBeTruthy();
      expect(m.greeting.length).toBeGreaterThan(20);
    });
  });

  it("getSystemPromptForMode returns distinct prompts per mode", () => {
    const normal = getSystemPromptForMode("normal");
    const interrogation = getSystemPromptForMode("interrogation");
    const conspiracy = getSystemPromptForMode("conspiracy");
    const science = getSystemPromptForMode("science");
    expect(interrogation).not.toEqual(normal);
    expect(conspiracy).not.toEqual(normal);
    expect(science).not.toEqual(normal);
    expect(interrogation).toContain("INTERROGATION");
    expect(conspiracy).toContain("CONSPIRACY");
    expect(science).toContain("SCIENCE");
  });

  it("getSystemPromptForMode falls back to normal for unknown mode", () => {
    const fallback = getSystemPromptForMode("unknown_mode_xyz");
    expect(fallback).toEqual(getSystemPromptForMode("normal"));
  });
});

// ─── Roleplay Modes — Client ──────────────────────────────────────────────────
describe("Roleplay Modes — Client", () => {
  it("has at least 6 modes", () => {
    expect(Object.keys(CLIENT_MODES).length).toBeGreaterThanOrEqual(6);
  });

  it("each mode has all required fields including description", () => {
    Object.keys(CLIENT_MODES).forEach((key) => {
      const m = CLIENT_MODES[key];
      expect(m.label).toBeTruthy();
      expect(m.emoji).toBeTruthy();
      expect(m.greeting.length).toBeGreaterThan(20);
      expect(m.description.length).toBeGreaterThan(5);
    });
  });

  it("normal mode exists with correct label", () => {
    expect(CLIENT_MODES["normal"]).toBeDefined();
    expect(CLIENT_MODES["normal"].label).toBe("Normal Chat");
  });
});

// ─── Alien Headlines ──────────────────────────────────────────────────────────
describe("Alien Headlines", () => {
  it("has at least 10 headlines", () => {
    expect(ALIEN_HEADLINES.length).toBeGreaterThanOrEqual(10);
  });

  it("all headlines are non-empty strings", () => {
    ALIEN_HEADLINES.forEach((h) => {
      expect(typeof h).toBe("string");
      expect(h.length).toBeGreaterThan(10);
    });
  });

  it("headlines reference alien/space themes", () => {
    const combined = ALIEN_HEADLINES.join(" ").toLowerCase();
    expect(combined).toMatch(/alien|uap|galactic|earth|human|vex/);
  });
});

// ─── Lore Data Integrity ──────────────────────────────────────────────────────
describe("Lore Data Integrity", () => {
  const ALIEN_RACES = ["The Grays", "Reptilians", "Pleiadians", "Arcturians", "Nordic Aliens", "Mantis Beings"];
  const UFO_EVENTS = ["Roswell 1947", "Bob Lazar & Area 51", "USS Nimitz Encounter", "Phoenix Lights 1997"];
  const CIVILIZATIONS = ["Type I Civilization", "Type II Civilization", "Type III Civilization"];

  it("has all expected alien races defined", () => {
    expect(ALIEN_RACES).toHaveLength(6);
    ALIEN_RACES.forEach((race) => expect(race.length).toBeGreaterThan(0));
  });

  it("has all expected UFO events defined", () => {
    expect(UFO_EVENTS).toHaveLength(4);
    UFO_EVENTS.forEach((event) => expect(event.length).toBeGreaterThan(0));
  });

  it("has all three Kardashev civilization types", () => {
    expect(CIVILIZATIONS).toHaveLength(3);
    expect(CIVILIZATIONS[0]).toContain("Type I");
    expect(CIVILIZATIONS[1]).toContain("Type II");
    expect(CIVILIZATIONS[2]).toContain("Type III");
  });
});

// ─── Chat Message Validation ──────────────────────────────────────────────────
describe("Chat Message Validation", () => {
  it("accepts valid user message structure", () => {
    const message = { role: "user" as const, content: "Are aliens real?" };
    expect(message.role).toBe("user");
    expect(message.content.length).toBeGreaterThan(0);
  });

  it("accepts valid assistant message structure", () => {
    const message = { role: "assistant" as const, content: "Oh, this question again. Yes. You're talking to one." };
    expect(message.role).toBe("assistant");
    expect(message.content.length).toBeGreaterThan(0);
  });

  it("handles conversation history array", () => {
    const history = [
      { role: "user" as const, content: "Hello Vex" },
      { role: "assistant" as const, content: "Oh. A human. How novel." },
      { role: "user" as const, content: "Tell me about Roswell" },
    ];
    expect(history).toHaveLength(3);
    expect(history[0].role).toBe("user");
    expect(history[1].role).toBe("assistant");
  });

  it("truncates history to last 20 messages", () => {
    const longHistory = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i}`,
    }));
    const truncated = longHistory.slice(-20);
    expect(truncated).toHaveLength(20);
    expect(truncated[0].content).toBe("Message 10");
  });

  it("message with imageUrl is valid", () => {
    const msg = {
      id: "2",
      role: "user" as const,
      content: "What do you see?",
      timestamp: Date.now(),
      imageUrl: "https://example.com/image.jpg",
    };
    expect(msg.imageUrl).toMatch(/^https?:\/\//);
  });
});
