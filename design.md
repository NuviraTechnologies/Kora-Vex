# Kora Vex — Mobile App Design Document

## Brand Identity

**Character:** Kora Vex — an alien gray with green-tinted skin who crash-landed on Earth. Hyper-intelligent, sarcastic, witty, and slightly condescending. Entertaining first, helpful second. Talks like a gamer/coder/crypto-savvy entity who has observed humans for centuries and finds them... amusing.

**Color Palette:**
- Background: `#000000` / `#0A0A0A` (deep black)
- Primary Neon Green: `#00FF41` (matrix green glow)
- Secondary Neon: `#39FF14` (bright alien green)
- Accent Magenta: `#FF00FF` (cyberpunk accent)
- Surface: `#0D1117` (dark card surface)
- Border: `#1A2A1A` (subtle green-tinted border)
- Muted: `#4A7A4A` (dim green text)
- Foreground: `#E0FFE0` (light green-white text)

**Typography:** Monospace feel — system mono fonts for Vex's messages, clean sans-serif for user messages.

**Aesthetic:** Neon green cyberpunk alien nightclub. Roswell energy modernized. High contrast glow effects. Dark mode only.

---

## Screen List

### 1. Splash Screen
- Black background with neon green Kora Vex alien logo glowing in center
- Subtle pulse animation on the logo
- Auto-transitions to Onboarding (first launch) or Chat (returning user)

### 2. Onboarding Screen
- Full-screen dark background with animated star field
- Kora Vex alien character image (centered, glowing green)
- Title: "KORA VEX" in neon green monospace font
- Subtitle: "An alien. A genius. Slightly annoyed by your existence."
- Brief personality teaser text
- "MAKE CONTACT" CTA button (neon green, glowing border)
- Skip option for returning users

### 3. Chat Screen (Primary Screen)
- **Header:** Kora Vex avatar (small alien icon) + name + "ONLINE" status indicator (pulsing green dot)
- **Message List (FlatList):**
  - Vex messages: left-aligned, dark surface bubble, neon green text, monospace font, subtle green glow border
  - User messages: right-aligned, dark green surface, lighter text
  - Typing indicator: three pulsing green dots when Vex is "thinking"
  - Timestamps in dim muted green
- **Input Area:**
  - Dark input field with green border glow on focus
  - Send button: neon green alien icon
  - Subtle haptic on send
- **Mode Indicator:** Small badge showing current mode (CHAT / ROLEPLAY / ALIEN LORE)

### 4. Alien Lore Screen (Tab)
- Grid of alien fact cards
- Each card: alien race name, brief description, glowing icon
- Tap to expand with full lore
- Categories: Alien Races, UFO Events, Civilizations, DNA & Science, Conspiracies

### 5. Settings Screen (Tab)
- App version / about Kora Vex
- Clear chat history
- Sound effects toggle
- Haptics toggle
- "Report a bug" link

---

## Key User Flows

### Flow 1: First Launch → Chat
1. Splash screen (1.5s) → Onboarding screen
2. User reads intro → taps "MAKE CONTACT"
3. Vex sends opening sarcastic greeting automatically
4. User types first message → Vex responds in character
5. Conversation continues with full personality

### Flow 2: Returning User → Chat
1. Splash screen → directly to Chat screen
2. Previous conversation history loaded
3. Vex may acknowledge the return with a snarky comment

### Flow 3: Alien Lore Exploration
1. User taps "LORE" tab
2. Browses alien race cards
3. Taps a card → full lore modal slides up
4. "Ask Vex about this" button → jumps to chat with pre-filled question

### Flow 4: Roleplay Mode
1. User types "let's roleplay" or taps mode button
2. Vex acknowledges and enters roleplay mode
3. Mode badge updates to "ROLEPLAY"
4. Vex stays in character but adapts to scenario

---

## Navigation Structure

```
Root Stack
├── Onboarding (shown once on first launch)
└── Tabs
    ├── Chat (index) — primary screen
    ├── Lore — alien fact cards
    └── Settings
```

---

## Animation & Interaction Design

- **Message appear:** Fade in + slight upward slide (200ms)
- **Typing indicator:** Three dots with staggered pulse animation
- **Send button:** Scale press feedback (0.95) + haptic
- **Neon glow:** Subtle shadow glow on Vex message bubbles
- **Star field:** Slow parallax star animation on onboarding
- **Mode switch:** Smooth badge color transition

---

## Kid-Friendly Content Guidelines

- No profanity, sexual content, violence, or adult themes in Vex's responses
- Sarcasm and wit are always playful, never mean-spirited or bullying
- Alien "roasting" is friendly and self-aware
- Content filter applied at system prompt level
- All humor is age-appropriate (PG rating)
