/** @type {const} */
const themeColors = {
  // Core — always dark, no light mode for Kora Vex
  primary:     { light: '#00FF41', dark: '#00FF41' },   // Neon green — VEX signature
  background:  { light: '#000000', dark: '#000000' },   // Pure black
  surface:     { light: '#0A0A0A', dark: '#0A0A0A' },   // Near-black cards
  surface2:    { light: '#111111', dark: '#111111' },   // Slightly elevated surface
  foreground:  { light: '#FFFFFF', dark: '#FFFFFF' },   // Pure white text
  muted:       { light: '#8A9BA8', dark: '#8A9BA8' },   // Muted text
  border:      { light: '#1A2A1A', dark: '#1A2A1A' },   // Dark green-tinted border
  borderGlow:  { light: '#00FF4130', dark: '#00FF4130' }, // Glowing green border
  success:     { light: '#00FF41', dark: '#00FF41' },   // Same as primary
  warning:     { light: '#FFD700', dark: '#FFD700' },   // Gold
  error:       { light: '#FF3B30', dark: '#FF3B30' },   // Red

  // VEX Brand extras
  neonGreen:   { light: '#00FF41', dark: '#00FF41' },   // Bright neon
  neonDim:     { light: '#00C832', dark: '#00C832' },   // Dimmer neon for secondary
  neonGlow:    { light: '#00FF4120', dark: '#00FF4120' }, // Transparent glow
  cosmic:      { light: '#001A00', dark: '#001A00' },   // Deep space green-black
  gold:        { light: '#FFD700', dark: '#FFD700' },   // VEX Coin gold
  tint:        { light: '#00FF41', dark: '#00FF41' },   // Tab bar active tint
};

module.exports = { themeColors };
