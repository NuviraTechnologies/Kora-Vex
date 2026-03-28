import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { ScreenContainer } from "@/components/screen-container";
import { useVexCoins } from "@/lib/vex-coins";
import { router } from "expo-router";

const CHAT_STORAGE_KEY = "kv_chat_history";
const ONBOARDING_KEY = "kv_onboarding_done";
const HAPTICS_KEY = "kv_haptics_enabled";
const VOICE_KEY = "kv_voice_enabled";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function SettingsScreen() {
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
    if (val && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleVoice = async (val: boolean) => {
    setVoiceEnabled(val);
    await AsyncStorage.setItem(VOICE_KEY, val.toString());
    haptic();
    if (!val) await Speech.stop();
  };

  const testVoice = async () => {
    haptic();
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const voices = await Speech.getAvailableVoicesAsync();
    const preferred = voices.find(
      (v) =>
        v.identifier.includes("en-GB") ||
        v.identifier.includes("en-IE") ||
        v.identifier.includes("Daniel") ||
        v.identifier.includes("Moira")
    );
    Speech.speak(
      "Greetings, human. This is Kora Vex. My voice has been calibrated for your primitive auditory system. You're welcome.",
      {
        voice: preferred?.identifier,
        rate: 0.92,
        pitch: 0.88,
        language: "en-GB",
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      }
    );
  };

  const clearChat = () => {
    Alert.alert(
      "Clear Chat History",
      "Vex will forget everything you've discussed. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            haptic();
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
            Alert.alert("Cleared", "Vex has wiped your conversation from the record. How convenient for you.");
          },
        },
      ]
    );
  };

  const shareChat = async () => {
    haptic();
    try {
      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (!stored) {
        Alert.alert("No Chat", "Nothing to share yet. Talk to Vex first.");
        return;
      }
      const messages = JSON.parse(stored) as Message[];
      const text = messages
        .map((m) => `${m.role === "assistant" ? "KORA VEX" : "YOU"}: ${m.content}`)
        .join("\n\n");
      await Share.share({
        message: `My conversation with Kora Vex — the alien AI\n\n${text}\n\n— Chat with Kora Vex`,
        title: "My Kora Vex Conversation",
      });
    } catch {
      Alert.alert("Share Failed", "Could not share the conversation.");
    }
  };

  const resetOnboarding = () => {
    Alert.alert(
      "Replay Intro",
      "This will show the intro screen again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            haptic();
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background" safeAreaClassName="bg-background">
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <Text style={styles.headerSub}>CONFIGURE YOUR ALIEN INTERFACE</Text>
        </View>

        {/* Vex Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>YOUR VEX STATS</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⚡ {coins}</Text>
              <Text style={styles.statLabel}>VEX COINS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔥 {streak}</Text>
              <Text style={styles.statLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>👽</Text>
              <Text style={styles.statLabel}>KORA VEX</Text>
            </View>
          </View>
          <Text style={styles.statsNote}>
            {coins >= 100
              ? "Impressive dedication. Vex is... mildly impressed."
              : "Keep chatting to earn more VEX Coins."}
          </Text>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VOICE & AUDIO</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Speak Responses</Text>
              <Text style={styles.settingDesc}>Vex reads every response aloud (Northwestern European accent)</Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={toggleVoice}
              trackColor={{ false: "#1a1a1a", true: "#003300" }}
              thumbColor={voiceEnabled ? "#00FF41" : "#444444"}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            onPress={testVoice}
          >
            <Text style={styles.actionLabel}>{isSpeaking ? "⏹ Stop Voice Test" : "🔊 Test Vex's Voice"}</Text>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>
        </View>

        {/* Interaction Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERACTION</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Haptic Feedback</Text>
              <Text style={styles.settingDesc}>Vibration on button taps and Vex responses</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={toggleHaptics}
              trackColor={{ false: "#1a1a1a", true: "#003300" }}
              thumbColor={hapticsEnabled ? "#00FF41" : "#444444"}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            onPress={shareChat}
          >
            <Text style={styles.actionLabel}>📤 Share Conversation</Text>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionRow, styles.actionRowDanger, pressed && { opacity: 0.7 }]}
            onPress={clearChat}
          >
            <Text style={[styles.actionLabel, styles.actionLabelDanger]}>🗑 Clear Chat History</Text>
            <Text style={[styles.actionArrow, styles.actionLabelDanger]}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
            onPress={resetOnboarding}
          >
            <Text style={styles.actionLabel}>↩ Replay Intro</Text>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>KORA VEX · GALACTIC EDITION</Text>
            <Text style={styles.aboutVersion}>Version 2.0</Text>
            <Text style={styles.aboutDesc}>
              An alien intelligence from Zeta Reticuli, stranded on Earth and available for your entertainment.
              Features: AI chat with full alien personality, voice output (Northwestern European accent),
              image analysis, 6 roleplay modes, VEX Coin rewards, alien news ticker, and voice input.
            </Text>
          </View>
        </View>

        {/* Vex Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "I have crossed 39 light years to get here. The least you can do is give me a 5-star review."
          </Text>
          <Text style={styles.quoteAuthor}>— Kora Vex, probably</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { color: "#00FF41", fontSize: 22, fontWeight: "800", letterSpacing: 3, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  headerSub: { color: "#00AA28", fontSize: 10, letterSpacing: 2, marginTop: 2, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },

  statsCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: "#001a00", borderWidth: 1, borderColor: "#00FF41", borderRadius: 14, padding: 16 },
  statsTitle: { color: "#00FF41", fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 12, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { color: "#00FF41", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#00AA28", fontSize: 9, letterSpacing: 1, marginTop: 4, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  statDivider: { width: 1, height: 40, backgroundColor: "#003300" },
  statsNote: { color: "#005500", fontSize: 11, textAlign: "center", marginTop: 12, fontStyle: "italic" },

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: "#00AA28", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 10, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  settingRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#001a00", borderWidth: 1, borderColor: "#003300", borderRadius: 12, padding: 14, marginBottom: 8 },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { color: "#00FF41", fontSize: 14, fontWeight: "600" },
  settingDesc: { color: "#005500", fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#001a00", borderWidth: 1, borderColor: "#003300", borderRadius: 12, padding: 14, marginBottom: 8 },
  actionRowDanger: { borderColor: "#330000", backgroundColor: "#0d0000" },
  actionLabel: { color: "#00FF41", fontSize: 14, fontWeight: "600" },
  actionLabelDanger: { color: "#FF4444" },
  actionArrow: { color: "#00AA28", fontSize: 20 },

  aboutCard: { backgroundColor: "#001a00", borderWidth: 1, borderColor: "#003300", borderRadius: 12, padding: 16 },
  aboutTitle: { color: "#00FF41", fontSize: 14, fontWeight: "800", letterSpacing: 2, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  aboutVersion: { color: "#00AA28", fontSize: 11, marginTop: 2, marginBottom: 10 },
  aboutDesc: { color: "#005500", fontSize: 12, lineHeight: 18 },

  quoteContainer: { marginHorizontal: 20, marginBottom: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#001a00" },
  quoteText: { color: "#003300", fontSize: 12, fontStyle: "italic", lineHeight: 18, textAlign: "center" },
  quoteAuthor: { color: "#002200", fontSize: 11, textAlign: "center", marginTop: 6 },
});
