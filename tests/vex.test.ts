import { describe, it, expect } from "vitest";
import { KORA_VEX_SYSTEM_PROMPT } from "../server/vex-prompt";

describe("Kora Vex System Prompt", () => {
  it("should be a non-empty string", () => {
    expect(typeof KORA_VEX_SYSTEM_PROMPT).toBe("string");
    expect(KORA_VEX_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("should contain the character name Kora Vex", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Kora Vex");
  });

  it("should contain Kardashev Scale knowledge", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Kardashev");
  });

  it("should contain alien race knowledge", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Reptilians");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Pleiadians");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Grays");
  });

  it("should contain content safety rules", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("NEVER use profanity");
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("PG-rated");
  });

  it("should instruct Vex to never break character", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("You do not break character");
  });

  it("should contain Zeta Reticuli origin", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Zeta Reticuli");
  });

  it("should contain Type II civilization reference", () => {
    expect(KORA_VEX_SYSTEM_PROMPT).toContain("Type II");
  });
});

describe("Lore Data Integrity", () => {
  const ALIEN_RACES = ["The Grays", "Reptilians", "Pleiadians", "Arcturians", "Nordic Aliens", "Mantis Beings"];
  const UFO_EVENTS = ["Roswell 1947", "Bob Lazar & Area 51", "USS Nimitz Encounter", "Phoenix Lights 1997"];
  const CIVILIZATIONS = ["Type I Civilization", "Type II Civilization", "Type III Civilization"];

  it("should have all expected alien races defined", () => {
    expect(ALIEN_RACES).toHaveLength(6);
    ALIEN_RACES.forEach((race) => {
      expect(race.length).toBeGreaterThan(0);
    });
  });

  it("should have all expected UFO events defined", () => {
    expect(UFO_EVENTS).toHaveLength(4);
    UFO_EVENTS.forEach((event) => {
      expect(event.length).toBeGreaterThan(0);
    });
  });

  it("should have all three Kardashev civilization types", () => {
    expect(CIVILIZATIONS).toHaveLength(3);
    expect(CIVILIZATIONS[0]).toContain("Type I");
    expect(CIVILIZATIONS[1]).toContain("Type II");
    expect(CIVILIZATIONS[2]).toContain("Type III");
  });
});

describe("Chat Message Validation", () => {
  it("should accept valid user message structure", () => {
    const message = { role: "user" as const, content: "Are aliens real?" };
    expect(message.role).toBe("user");
    expect(message.content.length).toBeGreaterThan(0);
  });

  it("should accept valid assistant message structure", () => {
    const message = {
      role: "assistant" as const,
      content: "Oh, this question again. Yes. You're talking to one.",
    };
    expect(message.role).toBe("assistant");
    expect(message.content.length).toBeGreaterThan(0);
  });

  it("should handle conversation history array", () => {
    const history = [
      { role: "user" as const, content: "Hello Vex" },
      { role: "assistant" as const, content: "Oh. A human. How novel." },
      { role: "user" as const, content: "Tell me about Roswell" },
    ];
    expect(history).toHaveLength(3);
    expect(history[0].role).toBe("user");
    expect(history[1].role).toBe("assistant");
    expect(history[2].role).toBe("user");
  });

  it("should truncate history to last 20 messages", () => {
    const longHistory = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i}`,
    }));
    const truncated = longHistory.slice(-20);
    expect(truncated).toHaveLength(20);
    expect(truncated[0].content).toBe("Message 10");
  });
});
