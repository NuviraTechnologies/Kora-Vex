import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  Platform,
  Share,
  Image,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { setAudioModeAsync } from "expo-audio";
import { useVexCoins } from "@/lib/vex-coins";
import { VEX_ASSETS } from "@/vex-assets";

const C = {
  neon: "#00FF41",
  neonDim: "#00CC33",
  neonFaint: "#001a00",
  black: "#000000",
  deepBlack: "#010501",
  surface: "#020f02",
  surfaceHigh: "#041804",
  border: "#003300",
  textDim: "#004400",
  textMid: "#00AA28",
  orange: "#FF6600",
  gold: "#FFD700",
};

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const CHAT_STORAGE_KEY = "kv_chat_history";
const ONBOARDING_KEY = "kv_onboarding_done";
const HAPTICS_KEY = "kv_haptics_enabled";
const VOICE_KEY = "kv_voice_enabled";

function SettingRow({
  label,
  subtitle,
  emoji,
  value,
  onToggle,
}: {
  label: string;
  subtitle?: string;
  emoji: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingRowLeft}>
        <View style={styles.settingEmojiBadge}>
          <Text style={styles.settingEmoji}>{emoji}</Text>
        </View>
        <View style={styles.settingRowText}>
          <Text style={styles.settingLabel}>{label}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.neonDim }}
        thumbColor={value ? C.neon : C.textDim}
        ios_backgroundColor={C.border}
      />
    </View>
  );
}

function ActionRow({
  label,
  subtitle,
  emoji,
  onPress,
  danger,
}: {
  label: string;
  subtitle?: string;
  emoji: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={styles.settingRowLeft}>
        <View style={[styles.settingEmojiBadge, danger && styles.settingEmojiBadgeDanger]}>
          <Text style={styles.settingEmoji}>{emoji}</Text>
        </View>
        <View style={styles.settingRowText}>
          <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={[styles.rowChevron, danger && styles.settingLabelDanger]}>›</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { coins, streak } = useVexCoins();

  useEffect(() => {
    const load = async () => {
      const h = await AsyncStorage.getItem(HAPTICS_KEY);
      const v = await AsyncStorage.getItem(VOICE_KEY);
      setHapticsEnabled(h !== "false");
      setVoiceEnabled(v !== "false");
    };
    load();
  }, []);

  const haptic = useCallback(() => {
    if (hapticsEnabled && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticsEnabled]);

  const toggleHaptics = async (val: boolean) => {
    setHapticsEnabled(val);
    await AsyncStorage.setItem(HAPTICS_KEY, val.toString());
    if (val && Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleVoice = async (val: boolean) => {
    setVoiceEnabled(val);
    await AsyncStorage.setItem(VOICE_KEY, val.toString());
    haptic();
  };

  const testVoice = async () => {
    haptic();
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    try {
      if (Platform.OS !== "web") {
        await setAudioModeAsync({ playsInSilentMode: true });
      }
      setIsSpeaking(true);
      Speech.speak(
        "Greetings, carbon-based life form. I am Kora Vex. I crashed here in 1972 and I have been mildly disappointed ever since. Your planet has excellent pizza, though. I will give you that.",
        {
          language: "en-GB",
          pitch: 0.85,
          rate: 0.92,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        }
      );
    } catch {
      setIsSpeaking(false);
    }
  };

  const clearChat = () => {
    haptic();
    Alert.alert(
      "Clear Chat History",
      "This will permanently delete all your conversations with Vex. He won't remember any of it. Not that he was particularly impressed anyway.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Done", "Chat history cleared. Fresh start. Vex is already judging your next message.");
          },
        },
      ]
    );
  };

  const resetOnboarding = async () => {
    haptic();
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    Alert.alert("Done", "Onboarding reset. Restart the app to see the intro again.");
  };

  const shareApp = async () => {
    haptic();
    try {
      await Share.share({
        message: "I've been talking to Kora Vex — a sarcastic alien AI who crashed on Earth in 1972 and has opinions about everything. Download the app and try it yourself!",
        title: "Kora Vex — Alien AI",
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Vex Profile Hero Card */}
        <View style={styles.profileCard}>
          <ImageBackground
            source={{ uri: VEX_ASSETS.yacht }}
            style={styles.profileBg}
            imageStyle={styles.profileBgImage}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)", C.black]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
          <View style={styles.profileContent}>
            <View style={styles.profileAvatarWrap}>
              <Image source={{ uri: VEX_ASSETS.logo }} style={styles.profileAvatar} />
              <View style={styles.profileOnlineDot} />
            </View>
            <Text style={styles.profileName}>KORA VEX</Text>
            <Text style={styles.profileTitle}>Alien Intelligence · Gen X · Zeta Reticuli</Text>
            <Text style={styles.profileBio}>
              "Crashed here in 1972. Still waiting for someone to come get me. In the meantime, I answer your questions. You're welcome."
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{coins}</Text>
                <Text style={styles.statLabel}>VEX COINS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>DAY STREAK</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>1972</Text>
                <Text style={styles.statLabel}>CRASH YEAR</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Voice section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔊 VOICE & AUDIO</Text>
          </View>
          <View style={styles.sectionCard}>
            <SettingRow
              label="Vex Voice Output"
              subtitle="Vex speaks his responses aloud"
              emoji="🗣️"
              value={voiceEnabled}
              onToggle={toggleVoice}
            />
            <View style={styles.rowDivider} />
            <ActionRow
              label={isSpeaking ? "Stop Speaking" : "Test Vex's Voice"}
              subtitle="Hear what Vex sounds like"
              emoji={isSpeaking ? "🔇" : "🎙️"}
              onPress={testVoice}
            />
          </View>
        </View>

        {/* Haptics section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📳 HAPTICS</Text>
          </View>
          <View style={styles.sectionCard}>
            <SettingRow
              label="Haptic Feedback"
              subtitle="Vibration on button taps"
              emoji="📳"
              value={hapticsEnabled}
              onToggle={toggleHaptics}
            />
          </View>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💾 DATA</Text>
          </View>
          <View style={styles.sectionCard}>
            <ActionRow
              label="Share Kora Vex"
              subtitle="Tell others about this alien"
              emoji="📤"
              onPress={shareApp}
            />
            <View style={styles.rowDivider} />
            <ActionRow
              label="Reset Onboarding"
              subtitle="See the intro screens again"
              emoji="🔄"
              onPress={resetOnboarding}
            />
            <View style={styles.rowDivider} />
            <ActionRow
              label="Clear Chat History"
              subtitle="Delete all conversations"
              emoji="🗑️"
              onPress={clearChat}
              danger
            />
          </View>
        </View>

        {/* About section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ℹ️ ABOUT</Text>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>2.0.0</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>AI Model</Text>
              <Text style={styles.aboutValue}>Gemini 2.5 Flash</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Vex Origin</Text>
              <Text style={styles.aboutValue}>Zeta Reticuli</Text>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Earth Arrival</Text>
              <Text style={styles.aboutValue}>1972</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Image source={{ uri: VEX_ASSETS.logo }} style={styles.footerLogo} />
          <Text style={styles.footerText}>KORA VEX</Text>
          <Text style={styles.footerSubtext}>
            "I've been on this planet for over 50 years.{"\n"}You still haven't figured out parking."
          </Text>
          <Text style={styles.footerCopy}>© 2024 VEX INTELLIGENCE DIVISION</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },
  scrollContent: { paddingBottom: 40 },

  // Profile card
  profileCard: { marginBottom: 24, overflow: "hidden" },
  profileBg: { height: 200, width: "100%" },
  profileBgImage: { opacity: 0.6 },
  profileContent: { padding: 20, paddingTop: 0 },
  profileAvatarWrap: { position: "relative", alignSelf: "center", marginBottom: 12, marginTop: -30 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.neon, shadowColor: C.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12 },
  profileOnlineDot: { position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: C.neon, borderWidth: 2, borderColor: C.black },
  profileName: { color: C.neon, fontSize: 22, fontWeight: "900", fontFamily: MONO, letterSpacing: 4, textAlign: "center" },
  profileTitle: { color: C.textDim, fontSize: 11, fontFamily: MONO, letterSpacing: 1, textAlign: "center", marginTop: 4, marginBottom: 10 },
  profileBio: { color: C.textMid, fontSize: 13, lineHeight: 20, textAlign: "center", fontStyle: "italic", marginBottom: 18 },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 16, padding: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: C.neon, fontSize: 20, fontWeight: "900", fontFamily: MONO },
  statLabel: { color: C.textDim, fontSize: 9, fontFamily: MONO, letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },

  // Sections
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { marginBottom: 8, paddingHorizontal: 4 },
  sectionTitle: { color: C.textDim, fontSize: 11, fontWeight: "900", fontFamily: MONO, letterSpacing: 2 },
  sectionCard: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 18, overflow: "hidden" },

  // Rows
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  settingRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingEmojiBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  settingEmojiBadgeDanger: { borderColor: "#FF3B30" },
  settingEmoji: { fontSize: 18 },
  settingRowText: { flex: 1 },
  settingLabel: { color: C.neon, fontSize: 14, fontWeight: "700", fontFamily: MONO },
  settingLabelDanger: { color: "#FF3B30" },
  settingSubtitle: { color: C.textDim, fontSize: 11, fontFamily: MONO, marginTop: 2 },
  rowChevron: { color: C.textDim, fontSize: 22, fontWeight: "300" },
  rowDivider: { height: 1, backgroundColor: C.border, marginLeft: 64 },

  // About rows
  aboutRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  aboutLabel: { color: C.textMid, fontSize: 13, fontFamily: MONO },
  aboutValue: { color: C.neon, fontSize: 13, fontFamily: MONO, fontWeight: "700" },

  // Footer
  footer: { alignItems: "center", paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20, gap: 8 },
  footerLogo: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: C.border, opacity: 0.6 },
  footerText: { color: C.textDim, fontSize: 14, fontWeight: "900", fontFamily: MONO, letterSpacing: 4 },
  footerSubtext: { color: C.textDim, fontSize: 11, fontFamily: MONO, textAlign: "center", lineHeight: 18, fontStyle: "italic" },
  footerCopy: { color: C.border, fontSize: 9, fontFamily: MONO, letterSpacing: 1, marginTop: 4 },
});
