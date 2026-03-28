import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useVexCoins } from "@/lib/vex-coins";
import { ROLEPLAY_MODES } from "@/lib/roleplay-modes";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUrl?: string;
}

const CHAT_STORAGE_KEY = "kv_chat_history";
const ONBOARDING_KEY = "kv_onboarding_done";
const HAPTICS_KEY = "kv_haptics_enabled";
const VOICE_KEY = "kv_voice_enabled";
const MODE_KEY = "kv_roleplay_mode";

// Northwestern European voice preference — en-GB or en-IE
const PREFERRED_VOICE_PATTERNS = ["en-GB", "en-IE", "en-AU", "com.apple.ttsbundle.Daniel", "com.apple.ttsbundle.Moira"];

async function getPreferredVoice(): Promise<string | undefined> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    for (const pattern of PREFERRED_VOICE_PATTERNS) {
      const match = voices.find(
        (v) => v.identifier.includes(pattern) || v.language.startsWith(pattern.replace("com.apple.ttsbundle.", ""))
      );
      if (match) return match.identifier;
    }
    // Fallback: any English voice
    const english = voices.find((v) => v.language.startsWith("en"));
    return english?.identifier;
  } catch {
    return undefined;
  }
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.vexBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

function MessageBubble({
  message,
  onSpeak,
  isSpeaking,
}: {
  message: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const isVex = message.role === "assistant";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isVex ? styles.vexRow : styles.userRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {isVex && (
        <Image source={require("../../assets/images/icon.png")} style={styles.vexAvatar} />
      )}
      <View style={styles.bubbleColumn}>
        {message.imageUrl && (
          <Image source={{ uri: message.imageUrl }} style={styles.messageImage} resizeMode="cover" />
        )}
        <View style={[styles.bubble, isVex ? styles.vexBubble : styles.userBubble]}>
          <Text style={[styles.bubbleText, isVex ? styles.vexText : styles.userText]}>
            {message.content}
          </Text>
        </View>
        {isVex && (
          <Pressable
            style={({ pressed }) => [styles.speakBtn, pressed && { opacity: 0.6 }]}
            onPress={() => onSpeak(message.content)}
          >
            <Text style={styles.speakBtnText}>{isSpeaking ? "⏹ Stop" : "🔊 Hear Vex"}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function NewsTicker({ headlines }: { headlines: string[] }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [tickerWidth, setTickerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const tickerText = headlines.join("   ·   ");

  useEffect(() => {
    if (contentWidth === 0 || tickerWidth === 0) return;
    scrollX.setValue(tickerWidth);
    const duration = contentWidth * 35;
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration,
        useNativeDriver: true,
      })
    ).start();
  }, [contentWidth, tickerWidth]);

  return (
    <View
      style={styles.tickerContainer}
      onLayout={(e) => setTickerWidth(e.nativeEvent.layout.width)}
    >
      <Text style={styles.tickerLabel}>📡 VEX NEWS</Text>
      <View style={styles.tickerScroll}>
        <Animated.Text
          style={[styles.tickerText, { transform: [{ translateX: scrollX }] }]}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          numberOfLines={1}
        >
          {tickerText}
        </Animated.Text>
      </View>
    </View>
  );
}

function CoinToast({ reason }: { reason: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.coinToast, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.coinToastText}>{reason}</Text>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentMode, setCurrentMode] = useState("normal");
  const [showModeModal, setShowModeModal] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const { coins, streak, addCoins, lastEarnReason } = useVexCoins();

  const chatMutation = trpc.chat.sendMessage.useMutation();
  const uploadImageMutation = trpc.chat.uploadImage.useMutation();
  const transcribeVoiceMutation = trpc.chat.transcribeVoice.useMutation();
  const headlinesQuery = trpc.chat.getHeadlines.useQuery();

  // Audio recorder
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    if (headlinesQuery.data?.headlines) {
      setHeadlines(headlinesQuery.data.headlines);
    }
  }, [headlinesQuery.data]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboardingDone) {
        router.replace("/onboarding");
        return;
      }

      const [storedHaptics, storedVoice, storedMode, storedChat] = await Promise.all([
        AsyncStorage.getItem(HAPTICS_KEY),
        AsyncStorage.getItem(VOICE_KEY),
        AsyncStorage.getItem(MODE_KEY),
        AsyncStorage.getItem(CHAT_STORAGE_KEY),
      ]);

      setHapticsEnabled(storedHaptics !== "false");
      setVoiceEnabled(storedVoice !== "false");
      if (storedMode) setCurrentMode(storedMode);

      if (storedChat) {
        setMessages(JSON.parse(storedChat) as Message[]);
      } else {
        const modeInfo = ROLEPLAY_MODES["normal"];
        const greeting: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: modeInfo.greeting,
          timestamp: Date.now(),
        };
        setMessages([greeting]);
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([greeting]));
        addCoins(10, "+10 VEX Coins — First Contact!");
      }

      // Request mic permission in background
      await requestRecordingPermissionsAsync();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });

      setIsInitialized(true);
    };
    init();
  }, []);

  const saveMessages = useCallback(async (msgs: Message[]) => {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  const haptic = useCallback(() => {
    if (hapticsEnabled && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticsEnabled]);

  // Speak Vex response
  const speakMessage = useCallback(async (text: string, msgId?: string) => {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
      setSpeakingMsgId(null);
      return;
    }
    const voice = await getPreferredVoice();
    if (msgId) setSpeakingMsgId(msgId);
    Speech.speak(text, {
      voice,
      rate: 0.92,
      pitch: 0.88,
      language: "en-GB",
      onDone: () => setSpeakingMsgId(null),
      onStopped: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });
  }, []);

  // Pick image from gallery
  const pickImage = useCallback(async () => {
    haptic();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImageBase64(asset.base64 ?? null);
      setPendingImageUrl(asset.uri);
    }
  }, [haptic]);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    haptic();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Access Denied", "Vex needs camera access to analyze your world.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImageBase64(asset.base64 ?? null);
      setPendingImageUrl(asset.uri);
    }
  }, [haptic]);

  // Start/stop voice recording
  const toggleRecording = useCallback(async () => {
    haptic();
    if (recorderState.isRecording) {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) return;
      setIsRecording(false);
      setIsTranscribing(true);
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const result = await transcribeVoiceMutation.mutateAsync({
          base64,
          mimeType: "audio/m4a",
        });
        if (result.text) {
          setInputText(result.text);
        }
      } catch {
        Alert.alert("Transcription Failed", "Vex couldn't hear you clearly. Try again.");
      } finally {
        setIsTranscribing(false);
      }
    } else {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    }
  }, [recorderState.isRecording, audioRecorder, haptic, transcribeVoiceMutation]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if ((!text && !pendingImageBase64) || isLoading) return;

    haptic();
    setInputText("");

    let uploadedImageUrl: string | undefined;

    // Upload image if pending
    if (pendingImageBase64) {
      setIsUploadingImage(true);
      try {
        const result = await uploadImageMutation.mutateAsync({
          base64: pendingImageBase64,
          mimeType: "image/jpeg",
        });
        uploadedImageUrl = result.url;
      } catch {
        // Use local URI as fallback display, but skip vision
      } finally {
        setIsUploadingImage(false);
        setPendingImageBase64(null);
        setPendingImageUrl(null);
      }
    }

    const userContent = text || (uploadedImageUrl ? "What do you see in this image?" : "");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: Date.now(),
      imageUrl: uploadedImageUrl,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = updatedMessages.slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await chatMutation.mutateAsync({
        messages: history,
        mode: currentMode,
        imageUrl: uploadedImageUrl,
      });

      const vexMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, vexMsg];
      setMessages(finalMessages);
      await saveMessages(finalMessages);

      // Award VEX Coins
      const msgCount = finalMessages.filter((m) => m.role === "user").length;
      if (msgCount === 5) addCoins(25, "+25 VEX Coins — 5 Messages!");
      else if (msgCount === 10) addCoins(50, "+50 VEX Coins — 10 Messages!");
      else if (msgCount % 20 === 0) addCoins(100, "+100 VEX Coins — Dedicated Human!");
      else addCoins(5);

      // Auto-speak Vex response if voice enabled
      if (voiceEnabled) {
        speakMessage(response.content, vexMsg.id);
      }

      if (hapticsEnabled && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "My communication array is experiencing interference. Probably your planet's terrible WiFi. Try again, human.",
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      await saveMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, chatMutation, saveMessages, haptic, currentMode, pendingImageBase64, uploadImageMutation, voiceEnabled, speakMessage, hapticsEnabled, addCoins]);

  const switchMode = useCallback(async (mode: string) => {
    setCurrentMode(mode);
    await AsyncStorage.setItem(MODE_KEY, mode);
    setShowModeModal(false);
    haptic();

    const modeInfo = ROLEPLAY_MODES[mode];
    if (modeInfo) {
      const modeMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: modeInfo.greeting,
        timestamp: Date.now(),
      };
      const updated = [...messages, modeMsg];
      setMessages(updated);
      await saveMessages(updated);
      if (voiceEnabled) speakMessage(modeInfo.greeting, modeMsg.id);
      addCoins(15, "+15 VEX Coins — Mode Switch!");
    }
  }, [messages, saveMessages, haptic, voiceEnabled, speakMessage, addCoins]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF41" />
        <Text style={styles.loadingText}>ESTABLISHING CONTACT...</Text>
      </View>
    );
  }

  const currentModeInfo = ROLEPLAY_MODES[currentMode] || ROLEPLAY_MODES["normal"];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../../assets/images/icon.png")} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>KORA VEX</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ONLINE · {currentModeInfo.emoji} {currentModeInfo.label.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>⚡ {coins}</Text>
          </View>
          {streak > 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.modeBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setShowModeModal(true)}
          >
            <Text style={styles.modeBtnText}>MODE</Text>
          </Pressable>
        </View>
      </View>

      {/* News Ticker */}
      {headlines.length > 0 && <NewsTicker headlines={headlines} />}

      <View style={styles.headerDivider} />

      {/* Coin Toast */}
      {lastEarnReason && <CoinToast reason={lastEarnReason} />}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onSpeak={(text) => speakMessage(text, item.id)}
              isSpeaking={speakingMsgId === item.id}
            />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Pending image preview */}
        {pendingImageUrl && (
          <View style={styles.pendingImageContainer}>
            <Image source={{ uri: pendingImageUrl }} style={styles.pendingImage} />
            <Pressable style={styles.removePendingImage} onPress={() => { setPendingImageUrl(null); setPendingImageBase64(null); }}>
              <Text style={styles.removePendingImageText}>✕</Text>
            </Pressable>
            <Text style={styles.pendingImageLabel}>Vex will analyze this image</Text>
          </View>
        )}

        {/* Input area */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Image / Camera buttons */}
          <View style={styles.inputToolbar}>
            <Pressable style={({ pressed }) => [styles.toolbarBtn, pressed && { opacity: 0.6 }]} onPress={pickImage}>
              <Text style={styles.toolbarBtnText}>🖼️</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.toolbarBtn, pressed && { opacity: 0.6 }]} onPress={takePhoto}>
              <Text style={styles.toolbarBtnText}>📷</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, isRecording && styles.toolbarBtnActive, pressed && { opacity: 0.6 }]}
              onPress={toggleRecording}
            >
              <Text style={styles.toolbarBtnText}>{isRecording ? "⏹" : "🎤"}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, voiceEnabled && styles.toolbarBtnActive, pressed && { opacity: 0.6 }]}
              onPress={() => {
                setVoiceEnabled((v) => {
                  AsyncStorage.setItem(VOICE_KEY, (!v).toString());
                  return !v;
                });
                haptic();
              }}
            >
              <Text style={styles.toolbarBtnText}>{voiceEnabled ? "🔊" : "🔇"}</Text>
            </Pressable>
          </View>

          {/* Status indicators */}
          {(isRecording || isTranscribing || isUploadingImage) && (
            <View style={styles.statusIndicator}>
              <ActivityIndicator size="small" color="#00FF41" />
              <Text style={styles.statusIndicatorText}>
                {isRecording ? "Recording... tap mic to stop" : isTranscribing ? "Transcribing..." : "Uploading image..."}
              </Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Vex anything..."
              placeholderTextColor="#2A4A2A"
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                pressed && styles.sendButtonPressed,
                ((!inputText.trim() && !pendingImageBase64) || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={(!inputText.trim() && !pendingImageBase64) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.sendIcon}>▶</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Roleplay Mode Modal */}
      <Modal visible={showModeModal} transparent animationType="slide" onRequestClose={() => setShowModeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModeModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>SELECT VEX MODE</Text>
            <Text style={styles.modalSubtitle}>Each mode unlocks a different side of Kora Vex</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(ROLEPLAY_MODES).map(([key, mode]) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.modeOption,
                    currentMode === key && styles.modeOptionActive,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => switchMode(key)}
                >
                  <Text style={styles.modeOptionEmoji}>{mode.emoji}</Text>
                  <View style={styles.modeOptionInfo}>
                    <Text style={[styles.modeOptionLabel, currentMode === key && styles.modeOptionLabelActive]}>
                      {mode.label}
                    </Text>
                    <Text style={styles.modeOptionDesc}>{mode.description}</Text>
                  </View>
                  {currentMode === key && <Text style={styles.modeCheckmark}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#00FF41", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", marginTop: 16, letterSpacing: 2 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#000000" },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: "#00FF41" },
  headerInfo: { flex: 1, marginLeft: 10 },
  headerName: { color: "#00FF41", fontSize: 15, fontWeight: "800", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", letterSpacing: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00FF41", marginRight: 5 },
  statusText: { color: "#00AA28", fontSize: 9, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", letterSpacing: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinBadge: { backgroundColor: "#001a00", borderWidth: 1, borderColor: "#00FF41", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  coinText: { color: "#00FF41", fontSize: 11, fontWeight: "700" },
  streakBadge: { backgroundColor: "#1a0d00", borderWidth: 1, borderColor: "#FF6600", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  streakText: { color: "#FF6600", fontSize: 11, fontWeight: "700" },
  modeBtn: { backgroundColor: "#001a00", borderWidth: 1, borderColor: "#00FF41", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  modeBtnText: { color: "#00FF41", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  headerDivider: { height: 1, backgroundColor: "#00FF41", opacity: 0.3 },

  // News ticker
  tickerContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#001a00", paddingVertical: 5, paddingHorizontal: 8, overflow: "hidden" },
  tickerLabel: { color: "#00FF41", fontSize: 9, fontWeight: "800", marginRight: 8, letterSpacing: 1, flexShrink: 0 },
  tickerScroll: { flex: 1, overflow: "hidden" },
  tickerText: { color: "#00AA28", fontSize: 10, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace", letterSpacing: 0.5 },

  // Coin toast
  coinToast: { position: "absolute", top: 110, alignSelf: "center", backgroundColor: "#001a00", borderWidth: 1, borderColor: "#00FF41", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, zIndex: 100 },
  coinToastText: { color: "#00FF41", fontSize: 13, fontWeight: "700" },

  // Messages
  messageList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  messageRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  vexRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  vexAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: "#00FF41" },
  bubbleColumn: { maxWidth: "78%", gap: 4 },
  messageImage: { width: "100%", height: 180, borderRadius: 10, borderWidth: 1, borderColor: "#00FF41" },
  bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  vexBubble: { backgroundColor: "#001a00", borderWidth: 1, borderColor: "#00FF41" },
  userBubble: { backgroundColor: "#00FF41" },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  vexText: { color: "#00FF41", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  userText: { color: "#000000", fontWeight: "600" },
  speakBtn: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3 },
  speakBtnText: { color: "#00AA28", fontSize: 11 },

  // Typing indicator
  typingContainer: { paddingHorizontal: 12, marginBottom: 8 },
  typingDots: { flexDirection: "row", gap: 4, paddingHorizontal: 14, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#00FF41" },

  // Pending image
  pendingImageContainer: { marginHorizontal: 16, marginBottom: 8, position: "relative" },
  pendingImage: { width: "100%", height: 120, borderRadius: 10, borderWidth: 1, borderColor: "#00FF41" },
  removePendingImage: { position: "absolute", top: 6, right: 6, backgroundColor: "#000000", borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#00FF41" },
  removePendingImageText: { color: "#00FF41", fontSize: 12, fontWeight: "700" },
  pendingImageLabel: { color: "#00AA28", fontSize: 11, marginTop: 4, textAlign: "center" },

  // Input
  inputArea: { backgroundColor: "#000000", borderTopWidth: 1, borderTopColor: "#001a00", paddingTop: 8, paddingHorizontal: 12 },
  inputToolbar: { flexDirection: "row", gap: 8, marginBottom: 8 },
  toolbarBtn: { backgroundColor: "#001a00", borderWidth: 1, borderColor: "#003300", borderRadius: 8, width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  toolbarBtnActive: { borderColor: "#00FF41", backgroundColor: "#002200" },
  toolbarBtnText: { fontSize: 18 },
  statusIndicator: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, paddingHorizontal: 4 },
  statusIndicatorText: { color: "#00AA28", fontSize: 12, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  inputWrapper: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: { flex: 1, backgroundColor: "#001a00", borderWidth: 1, borderColor: "#003300", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#00FF41", fontSize: 14, maxHeight: 100, fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  sendButton: { backgroundColor: "#00FF41", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sendButtonPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  sendButtonDisabled: { opacity: 0.3 },
  sendIcon: { color: "#000000", fontSize: 16, fontWeight: "800" },

  // Mode modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#050f05", borderTopWidth: 1, borderTopColor: "#00FF41", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  modalTitle: { color: "#00FF41", fontSize: 16, fontWeight: "800", letterSpacing: 2, textAlign: "center", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  modalSubtitle: { color: "#00AA28", fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 16 },
  modeOption: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: "#001a00", borderWidth: 1, borderColor: "#003300" },
  modeOptionActive: { borderColor: "#00FF41", backgroundColor: "#002a00" },
  modeOptionEmoji: { fontSize: 24, marginRight: 12 },
  modeOptionInfo: { flex: 1 },
  modeOptionLabel: { color: "#00AA28", fontSize: 14, fontWeight: "700" },
  modeOptionLabelActive: { color: "#00FF41" },
  modeOptionDesc: { color: "#005500", fontSize: 12, marginTop: 2 },
  modeCheckmark: { color: "#00FF41", fontSize: 18, fontWeight: "800" },
});
