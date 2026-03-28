# Kora Vex — Project TODO

## Branding & Assets
- [x] Generate Kora Vex neon green alien app icon
- [x] Configure app name, theme colors (neon green/black cyberpunk)
- [x] Update splash screen background to black with neon green

## Onboarding
- [x] Onboarding screen with alien character, intro text, "MAKE CONTACT" button
- [x] First-launch detection (AsyncStorage flag)
- [x] Auto-skip onboarding for returning users

## Chat Screen
- [x] Chat screen with FlatList message list
- [x] Vex message bubbles (left, neon green, monospace, glow border)
- [x] User message bubbles (right, dark green surface)
- [x] Typing indicator (3 pulsing dots)
- [x] Message input with neon border glow on focus
- [x] Send button with haptic feedback
- [x] Auto-scroll to latest message
- [x] Chat history persistence (AsyncStorage)
- [x] Header with Vex avatar, name, online status dot

## AI Personality Engine
- [x] Kora Vex full system prompt (alien lore, sarcasm, wit, kid-safe)
- [x] Backend /chat endpoint with Vex personality injected
- [x] Session memory (last 20 messages for context)
- [x] Smart mode: tone softens slightly for serious questions, stays in character
- [x] Opening greeting from Vex on first message

## Alien Lore Tab
- [x] Alien lore screen with fact cards grid
- [x] Alien race cards (Grays, Reptilians, Pleiadians, Arcturians, Nordics, Mantis)
- [x] UFO/UAP events cards (Roswell, Phoenix Lights, Bob Lazar, Nimitz)
- [x] Civilization types cards (Kardashev Scale: Type I, II, III)
- [x] DNA & Science card
- [x] Card expand modal with full lore + Vex commentary
- [x] "Ask Vex about this" button on each card
- [x] Category filter chips

## Settings Tab
- [x] Settings screen
- [x] Clear chat history option
- [x] Haptics toggle
- [x] App version / about section
- [x] Vex profile card

## Navigation
- [x] Tab bar (Chat, Lore, Settings) with neon green active color
- [x] Onboarding stack navigation
- [x] Icon mappings for all tabs

## Polish & UX
- [x] Message fade-in + slide animation
- [x] Star field background on onboarding
- [x] Neon glow shadow on Vex bubbles
- [x] Dark mode only enforcement
- [x] Vitest unit tests (15 passing)
