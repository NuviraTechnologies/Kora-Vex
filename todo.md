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
- [x] Vitest unit tests

## Voice & Audio (v2)
- [x] TTS voice output — Vex speaks responses aloud (Northwestern European accent via expo-speech)
- [x] Voice toggle button in chat toolbar (speaker on/off)
- [x] Auto-speak Vex responses when voice is enabled
- [x] Voice input (speech-to-text) — tap mic to speak your message
- [x] Per-message "Hear Vex" speak/stop button
- [x] Voice test in Settings screen

## Image Upload & Vision (v2)
- [x] Image attach button in chat input bar (gallery picker)
- [x] Camera capture button in chat input bar
- [x] Send image to AI backend with vision prompt
- [x] Vex analyzes and reacts to uploaded images in character
- [x] Image preview in chat bubble
- [x] Pending image preview with remove button

## Roleplay Modes (v2)
- [x] Roleplay mode selector modal (6 modes)
- [x] Modes: Normal Chat, Alien Interrogation, Galaxy Tour Guide, Alien News Anchor, Conspiracy Theorist, Science Explainer
- [x] Active mode badge displayed in chat header
- [x] Mode-specific system prompt injection on server
- [x] Mode-specific greeting when switching
- [x] Mode persisted in AsyncStorage

## VEX Coin & Gamification (v2)
- [x] VEX Coin counter in chat header
- [x] Earn coins per message (+5), milestones (+25, +50, +100)
- [x] Daily streak tracker with fire emoji
- [x] Coin toast notification on earn
- [x] First contact bonus (+10)
- [x] Mode-switch bonus (+15)
- [x] Coin total and streak persisted in AsyncStorage
- [x] Stats card in Settings screen

## Alien News Ticker (v2)
- [x] Scrolling news ticker at top of Chat screen
- [x] 15 rotating alien "headlines" (Vex-style sarcastic news)
- [x] Headlines served from tRPC server endpoint

## Share & Export (v2)
- [x] Share conversation button in Settings (native Share sheet)
- [x] Formatted export with Kora Vex branding

## Tests (v2)
- [x] 25 passing vitest tests
- [x] Roleplay mode coverage (server + client)
- [x] Headlines data integrity tests
- [x] Image message validation tests
- [x] Mode fallback tests

## Bug Fixes (v2.1)
- [x] Fix TTS voice output — Vex not speaking on device (expo-speech native setup)
- [x] Fix mic recording — record button not capturing audio / no response
- [x] Fix voice transcription flow end-to-end (record → upload → transcribe → fill input)
- [x] Update Vex crash year from "23 years ago" to 1972 in system prompt
- [x] Update Vex crash year in onboarding screen text
- [x] Update Vex crash year in all UI strings and lore cards

## Gen X Personality & UI Overhaul (v2.1)
- [x] Update system prompt with full Gen X nostalgia personality (1972 crash, watched all of human culture evolve)
- [x] Add Gen X cultural reference examples to system prompt (Atari, VHS, dial-up, Nirvana, etc.)
- [x] Fix TTS voice — setAudioModeAsync before speak, strip markdown asterisks before speaking
- [x] Fix mic recording race condition — useEffect listener on recorderState for URI availability
- [x] Overhaul chat UI: markdown rendering for bold/italic in Vex responses
- [x] Add message copy button (long press or tap icon)
- [x] Add smooth scroll-to-bottom button when user scrolls up
- [x] Improve input bar: auto-grow textarea, character count, send on Enter
- [x] Add Vex "thinking" animation with alien flavor text
- [x] Add message timestamps on tap
- [x] Add haptic on message receive
- [x] Improve header with online status pulse animation
- [x] Add swipe-to-clear gesture on messages
- [x] Update onboarding with Gen X flavor text

## Publish-Ready Fixes (v2.2)
- [x] Fix EXPO_PUBLIC_API_BASE_URL — embed correct server URL in native builds (auto-injected by Manus on publish)
- [x] Add expo-speech config plugin to app.config.ts for iOS
- [x] Add iOS NSMicrophoneUsageDescription to app.config.ts
- [x] Verify recording stop/URI pattern matches expo-audio SDK 54 docs
- [x] TypeScript clean check (0 errors)
- [x] All tests passing (25/25)
- [x] Final checkpoint saved

## Billionaire UI Overhaul (v3.0)
- [x] Upload all Vex brand photos to CDN
- [x] Generate premium cosmic background art
- [x] Overhaul theme with glowing neon tokens and premium typography
- [x] Rebuild tab bar with glowing neon icons (always visible, not dark)
- [x] Rebuild onboarding with cinematic Vex imagery
- [x] Rebuild chat screen with premium Vex avatar header and cosmic bubbles
- [x] Rebuild Lore screen with premium card design
- [x] Rebuild Settings with premium Vex profile card
- [x] Fix EXPO_PUBLIC_API_BASE_URL for native builds (auto-injected by Manus on publish)
- [x] Fix TTS setAudioModeAsync + expo-speech plugin in app.config
- [x] Fix mic recording stop/URI pattern
- [x] Final TypeScript check + all tests passing (25/25, 0 TS errors)
- [x] Final checkpoint saved

## Cosmic Spaceship Upgrade (v4.0)
- [x] Generate unified Vex character image set (consistent face, cosmic/spaceship settings)
- [x] Generate spaceship cockpit UI background art
- [x] Upload all new images to CDN, update vex-assets.ts
- [x] Rebuild UI with spaceship cockpit aesthetic (holographic panels, star maps, tech HUD)
- [x] Expand Vex system prompt with real astronomical knowledge (NASA, exoplanets, black holes, cosmology)
- [x] Update all Vex photos in onboarding, chat, lore, settings to new consistent set
- [x] Final TypeScript check + tests
- [x] Checkpoint saved

## Legibility & UX Fix (v4.1)
- [x] Restore 3-slide onboarding (confirmed working — flag already set on device, Reset Onboarding button in Settings restores it)
- [x] Fix all dark-green-on-black text — textDim #006600 → #A8C4A8, textMid #00AA28 → #CCFFCC, bodyText #E8F5E8 added
- [x] Fix section labels (HAPTICS, DATA, ABOUT, VOICE) — now bright mint
- [x] Fix settings list item subtitles — now #CCFFCC readable
- [x] Fix lore card body text — now bodyText #E8F5E8
- [x] Fix chat screen muted/dim text — status text, timestamps, toolbar labels all upgraded
- [x] Fix onboarding slide body text — now #E8F5E8, fine print #A8C4A8
- [x] Ensure all interactive labels are bright enough for kids (13+) to read comfortably
- [x] TypeScript check + tests passing (0 errors, 25/25)
- [x] Checkpoint saved

## Premium Voice & Features Upgrade (v5.0)
- [x] Replace expo-speech with server-side Microsoft Edge TTS (premium neural voice)
- [x] Add /tts endpoint on server returning audio base64 via msedge-tts
- [x] Use "en-US-GuyNeural" (deep, clear, natural male voice) for Vex
- [x] Play TTS audio via expo-audio on device (not expo-speech)
- [x] Add file upload support (PDFs, text docs) — Vex reads and analyzes
- [x] Add AI image generation — user can ask Vex to "draw" anything
- [x] Show generated images inline in chat bubbles
- [x] Add "Draw for me" quick action button in chat toolbar

## Chat UI Overhaul (v5.1)
- [x] Fix chat screen scrolling — send button hidden when toolbar is open
- [x] Redesign input area: send button always visible, toolbar collapsible/compact
- [x] Clean up spacing — less bunched up, more breathing room
- [x] Move toolbar to a single row of small icon buttons (no labels needed)
- [x] Update age rating to 13+ (remove "all ages" / "kid-friendly" language)
- [x] Update app store description and content rating to Teen (13+)
- [x] Fix duplicate lore IDs causing React key warnings

## Full Chat UI Rebuild (v5.2)
- [x] Fix input/send button cut off by tab bar on all devices
- [x] Rebuild layout with correct KeyboardAvoidingView + safe area bottom insets
- [x] Beginner-friendly: add placeholder hint text, clear send button label
- [x] Toolbar: labeled buttons (Photo, Camera, File, Draw, Voice, Sound/Muted)
- [x] Ensure layout works on small phones (5") and large phones (6.7")

## Bug Fixes & Full Audit (v5.3)
- [x] Fix Draw (AI image generation) — now works via natural language
- [x] Fix toolbar overflow — Draw button removed, toolbar is now 5 buttons with horizontal scroll fallback
- [x] Audit and test Voice recording end-to-end — logic correct, error handling improved
- [x] Audit and test TTS voice playback end-to-end — Edge TTS working, Settings also updated
- [x] Audit and test File upload end-to-end — logic correct
- [x] Audit and test Photo/Camera upload end-to-end — logic correct
- [x] Audit and test Send message end-to-end — logic correct
- [x] Verify server image generation route exists and works — confirmed
- [x] Verify server TTS route exists and works — confirmed
- [x] Verify server chat route exists and works — confirmed
- [x] Natural language draw detection — "draw me X", "paint me X", "sketch X" etc. auto-triggers image generation
- [x] Settings Test Voice button now uses Edge TTS (en-US-GuyNeural) instead of old expo-speech

## Critical Fixes (v5.4)
- [x] Fix Vex system prompt — added IMAGE GENERATION section, Vex now knows he CAN draw and never refuses
- [x] Fix chat scroll — paddingBottom 120, scrollEventThrottle 16, proper KAV offset for iOS
- [x] Verify draw flow works end-to-end — natural language detection + server route confirmed

## Full Layout Rebuild (v5.5)
- [x] Chat messages disappear when keyboard opens — fixed: removed height behavior on Android, use pan mode
- [x] Rebuild layout: KAV behavior=undefined on Android, softwareKeyboardLayoutMode=pan in app.config
- [x] Images in chat: fixed to 260x260 so they’re always clearly visible
- [x] No more tiny trapped window — FlatList fills all available space
