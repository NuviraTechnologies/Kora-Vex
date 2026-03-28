import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const CHAT_STORAGE_KEY = "kv_chat_history";
const ONBOARDING_KEY = "kv_onboarding_done";
const HAPTICS_KEY = "kv_haptics_enabled";

export default function SettingsScreen() {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat History",
      "Kora Vex will forget everything. All conversations will be deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "This will show the intro screen again next time you open the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
          },
        },
      ]
    );
  };

  const toggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    await AsyncStorage.setItem(HAPTICS_KEY, value ? "true" : "false");
    if (value && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <Text style={styles.headerSub}>KORA VEX CONTROL PANEL</Text>
      </View>

      {/* Vex Profile Card */}
      <View style={styles.profileCard}>
        <Text style={styles.profileEmoji}>👽</Text>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>KORA VEX</Text>
          <Text style={styles.profileDesc}>
            Alien · Genius · Stranded since 2003
          </Text>
          <Text style={styles.profileDesc}>
            Origin: Zeta Reticuli · Type II Civilization
          </Text>
        </View>
      </View>

      {/* Settings sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDesc}>Vibration on button press</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
            trackColor={{ false: "#1A3A1A", true: "rgba(0,255,65,0.4)" }}
            thumbColor={hapticsEnabled ? "#00FF41" : "#4A7A4A"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATA</Text>

        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          onPress={handleClearChat}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Clear Chat History</Text>
            <Text style={styles.settingDesc}>Delete all conversations with Vex</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          onPress={handleResetOnboarding}
        >
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Reset Intro Screen</Text>
            <Text style={styles.settingDesc}>See the welcome screen again</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            Kora Vex is an AI-powered alien character app for entertainment purposes.
            All alien lore is based on documented reports, theories, and cultural mythology.
          </Text>
          <Text style={styles.aboutText}>
            Powered by advanced AI. Kid-friendly. Sarcasm included at no extra charge.
          </Text>
          <View style={styles.versionRow}>
            <Text style={styles.versionText}>VERSION 1.0.0</Text>
            <Text style={styles.versionText}>·</Text>
            <Text style={styles.versionText}>KORA VEX</Text>
          </View>
        </View>
      </View>

      {/* Vex quote */}
      <View style={styles.vexQuote}>
        <Text style={styles.vexQuoteText}>
          "Settings. How very human of you. I don't have settings. I have convictions."
        </Text>
        <Text style={styles.vexQuoteAttr}>— Kora Vex</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#00FF41",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    textShadowColor: "#00FF41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSub: {
    color: "#4A7A4A",
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#0D1117",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00FF41",
    padding: 16,
    gap: 14,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  profileEmoji: {
    fontSize: 44,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: "#00FF41",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 3,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  profileDesc: {
    color: "#4A7A4A",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#4A7A4A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1117",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1A3A1A",
    padding: 14,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D1117",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1A3A1A",
    padding: 14,
    marginBottom: 8,
  },
  actionRowPressed: {
    borderColor: "#00FF41",
    backgroundColor: "#0D1A0D",
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    color: "#E0FFE0",
    fontSize: 14,
    fontWeight: "600",
  },
  settingDesc: {
    color: "#4A7A4A",
    fontSize: 11,
  },
  actionArrow: {
    color: "#4A7A4A",
    fontSize: 20,
    fontWeight: "300",
  },
  aboutCard: {
    backgroundColor: "#0D1117",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1A3A1A",
    padding: 14,
    gap: 10,
  },
  aboutText: {
    color: "#6A9A6A",
    fontSize: 12,
    lineHeight: 18,
  },
  versionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  versionText: {
    color: "#2A4A2A",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 1,
  },
  vexQuote: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#00FF41",
  },
  vexQuoteText: {
    color: "#4A7A4A",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 6,
  },
  vexQuoteAttr: {
    color: "#2A4A2A",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
