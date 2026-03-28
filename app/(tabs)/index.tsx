import {
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
  Share,
  Clipboard,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useVexCoins } from "@/lib/vex-coins";
import { ROLEPLAY_MODES } from "@/lib/roleplay-modes";
import { VEX_ASSETS } from "@/vex-assets";

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

// Neon green palette
const C = {
  neon: "#00FF41",
  neonDim: "#00CC33",
  neonFaint: "#004400",
  neonGlow: "#00FF4133",
  black: "#000000",
  deepBlack: "#010501",
  surface: "#020f02",
  surfaceHigh: "#041804",
  border: "#003300",
  borderBright: "#00FF41",
  // Legibility-first: bright enough for kids to read on dark backgrounds
  textDim: "#A8C4A8",    // was #006600 — now soft light green/gray, readable
  textMid: "#CCFFCC",   // was #00AA28 — now bright mint, clearly visible
  bodyText: "#E8F5E8",  // near-white with green tint for body copy
  orange: "#FF8C00",
  red: "#FF5555",
  white: "#FFFFFF",
};

// Strip markdown symbols so TTS reads cleanly
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[_~>]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

// Current TTS audio player reference (for stop/cleanup)
let currentTTSPlayer: ReturnType<typeof createAudioPlayer> | null = null;

// Render Vex message text with markdown bold support
function VexMessageText({ text }: { text: string }) {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }
  if (parts.length === 0) {
    return <Text style={styles.vexText}>{text}</Text>;
  }
  return (
    <Text style={styles.vexText}>
      {parts.map((p, i) =>
        p.bold ? (
          <Text key={i} style={[styles.vexText, styles.vexTextBold]}>{p.text}</Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
  );
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
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }],
  });

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingAvatarWrap}>
        <Image source={{ uri: VEX_ASSETS.logo }} style={styles.vexAvatar} />
        <View style={styles.avatarGlow} />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </View>
        <Text style={styles.typingLabel}>Processing your primitive query...</Text>
      </View>
    </View>
  );
}

function MessageBubble({
  message,
  onSpeak,
  isSpeaking,
  onCopy,
}: {
  message: Message;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onCopy: (text: string) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const [showActions, setShowActions] = useState(false);
  const isVex = message.role === "assistant";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isVex ? styles.vexRow : styles.userRow,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {isVex && (
        <View style={styles.typingAvatarWrap}>
          <Image source={{ uri: VEX_ASSETS.avatarHUD }} style={styles.vexAvatar} />
          <View style={styles.avatarGlow} />
        </View>
      )}
      <View style={[styles.bubbleColumn, isVex ? styles.vexBubbleColumn : styles.userBubbleColumn]}>
        {message.imageUrl && (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        <Pressable
          onLongPress={() => {
            setShowActions((v) => !v);
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={({ pressed }) => [
            isVex ? styles.vexBubble : styles.userBubble,
            pressed && { opacity: 0.85 },
          ]}
        >
          {isVex ? (
            <VexMessageText text={message.content} />
          ) : (
            <Text style={styles.userText}>{message.content}</Text>
          )}
        </Pressable>

        {showActions && (
          <View style={[styles.actionRow, isVex ? styles.actionRowLeft : styles.actionRowRight]}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
              onPress={() => { onCopy(message.content); setShowActions(false); }}
            >
              <Text style={styles.actionBtnText}>📋 Copy</Text>
            </Pressable>
            {isVex && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, isSpeaking && styles.actionBtnActive, pressed && { opacity: 0.6 }]}
                onPress={() => { onSpeak(message.content); setShowActions(false); }}
              >
                <Text style={styles.actionBtnText}>{isSpeaking ? "⏹ Stop" : "🔊 Speak"}</Text>
              </Pressable>
            )}
            <Text style={styles.timestampText}>{timeStr}</Text>
          </View>
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
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration: contentWidth * 30,
        useNativeDriver: true,
      })
    ).start();
  }, [contentWidth, tickerWidth]);

  return (
    <View
      style={styles.tickerContainer}
      onLayout={(e) => setTickerWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.tickerLabelWrap}>
        <View style={styles.tickerDot} />
        <Text style={styles.tickerLabel}>VEX NEWS</Text>
      </View>
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
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.coinToast, { opacity, transform: [{ translateY }, { scale }] }]}>
      <Text style={styles.coinToastText}>{reason}</Text>
    </Animated.View>
  );
}

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.statusDot, { transform: [{ scale }], opacity }]} />;
}

// Glowing neon border component
function NeonBorder({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.neonBorderOuter, style]}>
      {children}
    </View>
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const { coins, streak, addCoins, lastEarnReason } = useVexCoins();

  const chatMutation = trpc.chat.sendMessage.useMutation();
  const uploadImageMutation = trpc.chat.uploadImage.useMutation();
  const transcribeVoiceMutation = trpc.chat.transcribeVoice.useMutation();
  const ttsMutation = trpc.chat.tts.useMutation();
  const uploadFileMutation = trpc.chat.uploadFile.useMutation();
  const generateImageMutation = trpc.chat.generateImage.useMutation();
  const headlinesQuery = trpc.chat.getHeadlines.useQuery();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Watch recorder state — when recording stops, URI becomes available
  useEffect(() => {
    if (!recorderState.isRecording && isRecording) {
      const handleStopComplete = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 400));
          const uri = audioRecorder.uri;
          if (!uri) {
            Alert.alert("Recording Error", "No audio captured. Please try again.");
            return;
          }
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const result = await transcribeVoiceMutation.mutateAsync({
            base64,
            mimeType: "audio/m4a",
          });
          if (result.text && result.text.trim()) {
            setInputText(result.text.trim());
            inputRef.current?.focus();
          } else {
            Alert.alert("Nothing Heard", "Vex couldn't make out what you said. Try again.");
          }
        } catch {
          Alert.alert("Transcription Failed", "Vex's audio sensors malfunctioned. Try again.");
        } finally {
          setIsTranscribing(false);
        }
      };
      handleStopComplete();
    }
  }, [recorderState.isRecording]);

  useEffect(() => {
    if (headlinesQuery.data?.headlines) {
      setHeadlines(headlinesQuery.data.headlines);
    }
  }, [headlinesQuery.data]);

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

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch {
        // Non-fatal
      }

      await requestRecordingPermissionsAsync();
      setIsInitialized(true);
    };
    init();
  }, []);

  const saveMessages = useCallback(async (msgs: Message[]) => {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  const haptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticsEnabled && Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  }, [hapticsEnabled]);

  const speakMessage = useCallback(async (text: string, msgId?: string) => {
    try {
      // Stop any currently playing TTS
      if (currentTTSPlayer) {
        try { currentTTSPlayer.remove(); } catch {}
        currentTTSPlayer = null;
        setSpeakingMsgId(null);
        if (speakingMsgId === msgId) return; // toggle off
      }
      if (msgId) setSpeakingMsgId(msgId);
      const cleanText = stripMarkdown(text).slice(0, 1500);
      // Call server-side Edge TTS (en-US-GuyNeural — deep, clear, natural)
      const result = await ttsMutation.mutateAsync({ text: cleanText, voice: "en-US-GuyNeural" });
      if (!result.base64) return;
      // Write to temp file and play
      await setAudioModeAsync({ playsInSilentMode: true });
      const tmpUri = FileSystem.cacheDirectory + `vex-tts-${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tmpUri, result.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const player = createAudioPlayer({ uri: tmpUri });
      currentTTSPlayer = player;
      player.play();
      // Clean up when done
      const checkDone = setInterval(() => {
        try {
          if (!player.playing) {
            clearInterval(checkDone);
            setSpeakingMsgId(null);
            try { player.remove(); } catch {}
            if (currentTTSPlayer === player) currentTTSPlayer = null;
          }
        } catch {
          clearInterval(checkDone);
          setSpeakingMsgId(null);
        }
      }, 500);
    } catch {
      setSpeakingMsgId(null);
    }
  }, [speakingMsgId, ttsMutation]);

  const copyMessage = useCallback((text: string) => {
    Clipboard.setString(text);
    haptic(Haptics.ImpactFeedbackStyle.Medium);
  }, [haptic]);

  // Pick a file (PDF, txt, csv, md) for Vex to analyze
  const pickFile = useCallback(async () => {
    haptic();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "application/pdf", "text/csv", "text/markdown", "application/msword"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setIsUploadingFile(true);
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const uploadResult = await uploadFileMutation.mutateAsync({
        base64,
        mimeType: asset.mimeType ?? "application/octet-stream",
        fileName: asset.name,
      });
      setIsUploadingFile(false);
      // Build a message asking Vex to analyze the file
      const fileMsg = uploadResult.textContent
        ? `I'm sharing a file with you: "${asset.name}". Here's the content:\n\n${uploadResult.textContent}\n\nPlease analyze this and give me your alien take on it.`
        : `I uploaded a file: "${asset.name}" (${asset.mimeType}). The file is available at: ${uploadResult.url}. Please acknowledge it.`;
      setInputText(fileMsg);
    } catch {
      setIsUploadingFile(false);
      Alert.alert("File Upload Failed", "Could not read that file. Try a .txt or .csv file.");
    }
  }, [haptic, uploadFileMutation]);

  // Ask Vex to draw/generate an image
  const askVexToDraw = useCallback(async () => {
    haptic();
    const prompt = inputText.trim();
    if (!prompt) {
      Alert.alert("What should Vex draw?", "Type a description first, then tap Draw.");
      return;
    }
    setIsGeneratingImage(true);
    setInputText("");
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `🎨 Draw for me: ${prompt}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const result = await generateImageMutation.mutateAsync({ prompt });
      const vexMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `*adjusts holographic display* Fine, human. I've rendered your request using my superior alien artistic algorithms. Behold:`,
        timestamp: Date.now() + 1,
        imageUrl: result.url,
      };
      setMessages((prev) => [...prev, vexMsg]);
      saveMessages([...messages, userMsg, vexMsg]);
      if (voiceEnabled) speakMessage(vexMsg.content, vexMsg.id);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "My image rendering matrix is temporarily offline. Even alien tech has bad days. Try again.",
        timestamp: Date.now() + 1,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [haptic, inputText, generateImageMutation, messages, saveMessages, voiceEnabled, speakMessage]);

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

  const toggleRecording = useCallback(async () => {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (recorderState.isRecording) {
      await audioRecorder.stop();
    } else {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert("Microphone Access Denied", "Vex needs your mic to hear you. Check Settings.");
          return;
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
      } catch {
        Alert.alert("Recording Failed", "Could not start recording. Please try again.");
      }
    }
  }, [recorderState.isRecording, audioRecorder, haptic]);

  const shareChat = useCallback(async () => {
    const text = messages
      .map((m) => `${m.role === "assistant" ? "Kora Vex" : "You"}: ${m.content}`)
      .join("\n\n");
    await Share.share({
      message: `My conversation with Kora Vex — The Alien AI\n\n${text}\n\n— Kora Vex App`,
    });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if ((!text && !pendingImageBase64) || isLoading) return;

    haptic();
    setInputText("");
    setInputHeight(44);

    let uploadedImageUrl: string | undefined;

    if (pendingImageBase64) {
      setIsUploadingImage(true);
      try {
        const result = await uploadImageMutation.mutateAsync({
          base64: pendingImageBase64,
          mimeType: "image/jpeg",
        });
        uploadedImageUrl = result.url;
      } catch {
        // Use local URI as fallback display
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
    setShowScrollBtn(false);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

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

      const msgCount = finalMessages.filter((m) => m.role === "user").length;
      if (msgCount === 5) addCoins(25, "+25 VEX Coins — 5 Messages!");
      else if (msgCount === 10) addCoins(50, "+50 VEX Coins — 10 Messages!");
      else if (msgCount === 25) addCoins(100, "+100 VEX Coins — Dedicated Human!");
      else if (msgCount % 50 === 0) addCoins(200, "+200 VEX Coins — Legend Status!");
      else addCoins(5);

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
    haptic(Haptics.ImpactFeedbackStyle.Medium);

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
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, saveMessages, haptic, voiceEnabled, speakMessage, addCoins]);

  if (!isInitialized) {
    return (
      <ImageBackground
        source={{ uri: VEX_ASSETS.spaceshipBg }}
        style={styles.loadingContainer}
        imageStyle={{ opacity: 0.22, resizeMode: "cover" }}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.85)", "rgba(0,5,0,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingGlow} />
        <Image source={{ uri: VEX_ASSETS.avatarHUD }} style={styles.loadingLogo} />
        <ActivityIndicator size="large" color={C.neon} style={{ marginTop: 28 }} />
        <Text style={styles.loadingText}>ESTABLISHING CONTACT</Text>
        <Text style={styles.loadingSubtext}>Tuning alien frequencies...</Text>
        {/* HUD corner accents */}
        <View style={styles.hudCornerTL} />
        <View style={styles.hudCornerTR} />
        <View style={styles.hudCornerBL} />
        <View style={styles.hudCornerBR} />
      </ImageBackground>
    );
  }

  const currentModeInfo = ROLEPLAY_MODES[currentMode] || ROLEPLAY_MODES["normal"];

  return (
    <ImageBackground
      source={{ uri: VEX_ASSETS.spaceshipBg }}
      style={[styles.container, { paddingTop: insets.top }]}
      imageStyle={{ opacity: 0.08, resizeMode: "cover" }}
    >

      {/* Premium Header */}
      <View style={styles.header}>
        {/* Left: Avatar + Info */}
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: VEX_ASSETS.logo }} style={styles.headerAvatar} />
            <View style={styles.avatarRing} />
            <View style={styles.avatarOnlineDot}>
              <PulseDot />
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>KORA VEX</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                {currentModeInfo.emoji} {currentModeInfo.label.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Coins, Streak, Buttons */}
        <View style={styles.headerRight}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>⚡</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
          {streak > 1 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥{streak}</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
            onPress={shareChat}
          >
            <Text style={styles.headerBtnText}>↑</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.modePill, pressed && { opacity: 0.7 }]}
            onPress={() => { setShowModeModal(true); haptic(); }}
          >
            <Text style={styles.modePillText}>MODE</Text>
          </Pressable>
        </View>
      </View>

      {/* Neon divider */}
      <LinearGradient
        colors={["transparent", C.neon, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.neonDivider}
      />

      {/* News Ticker */}
      {headlines.length > 0 && <NewsTicker headlines={headlines} />}

      {/* Coin Toast */}
      {lastEarnReason && <CoinToast key={lastEarnReason + coins} reason={lastEarnReason} />}

      {/* Chat area */}
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
              onCopy={copyMessage}
            />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            if (!showScrollBtn) flatListRef.current?.scrollToEnd({ animated: false });
          }}
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            const distFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
            setShowScrollBtn(distFromBottom > 120);
          }}
          scrollEventThrottle={100}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <Pressable
            style={({ pressed }) => [styles.scrollBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
              setShowScrollBtn(false);
            }}
          >
            <Text style={styles.scrollBtnText}>↓</Text>
          </Pressable>
        )}

        {/* Pending image preview */}
        {pendingImageUrl && (
          <View style={styles.pendingImageContainer}>
            <Image source={{ uri: pendingImageUrl }} style={styles.pendingImage} />
            <Pressable
              style={styles.removePendingImage}
              onPress={() => { setPendingImageUrl(null); setPendingImageBase64(null); }}
            >
              <Text style={styles.removePendingImageText}>✕</Text>
            </Pressable>
            <Text style={styles.pendingImageLabel}>📡 Vex will analyze this</Text>
          </View>
        )}

        {/* Input area */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>

          {/* Toolbar row */}
          <View style={styles.inputToolbar}>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, pressed && { opacity: 0.6 }]}
              onPress={pickImage}
            >
              <Text style={styles.toolbarBtnIcon}>🖼️</Text>
              <Text style={styles.toolbarBtnLabel}>Photo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, pressed && { opacity: 0.6 }]}
              onPress={takePhoto}
            >
              <Text style={styles.toolbarBtnIcon}>📷</Text>
              <Text style={styles.toolbarBtnLabel}>Camera</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, pressed && { opacity: 0.6 }]}
              onPress={pickFile}
            >
              <Text style={styles.toolbarBtnIcon}>{isUploadingFile ? "⏳" : "📎"}</Text>
              <Text style={styles.toolbarBtnLabel}>File</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.toolbarBtn,
                isGeneratingImage && styles.toolbarBtnActive,
                pressed && { opacity: 0.6 },
              ]}
              onPress={askVexToDraw}
            >
              <Text style={styles.toolbarBtnIcon}>{isGeneratingImage ? "⏳" : "🎨"}</Text>
              <Text style={[styles.toolbarBtnLabel, isGeneratingImage && { color: C.neon }]}>Draw</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.toolbarBtn,
                isRecording && styles.toolbarBtnRecording,
                pressed && { opacity: 0.6 },
              ]}
              onPress={toggleRecording}
            >
              <Text style={styles.toolbarBtnIcon}>{isRecording ? "⏹" : "🎤"}</Text>
              <Text style={[styles.toolbarBtnLabel, isRecording && { color: C.red }]}>
                {isRecording ? "Stop" : "Mic"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.toolbarBtn,
                voiceEnabled && styles.toolbarBtnActive,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => {
                setVoiceEnabled((v) => {
                  AsyncStorage.setItem(VOICE_KEY, (!v).toString());
                  return !v;
                });
                haptic();
              }}
            >
              <Text style={styles.toolbarBtnIcon}>{voiceEnabled ? "🔊" : "🔇"}</Text>
              <Text style={[styles.toolbarBtnLabel, voiceEnabled && { color: C.neon }]}>
                {voiceEnabled ? "On" : "Off"}
              </Text>
            </Pressable>
          </View>

          {/* Status indicators */}
          {(isRecording || isTranscribing || isUploadingImage || isUploadingFile || isGeneratingImage) && (
            <View style={styles.statusIndicator}>
              <View style={styles.statusIndicatorDot} />
              <Text style={styles.statusIndicatorText}>
                {isRecording
                  ? "Recording — tap to stop"
                  : isTranscribing
                  ? "Vex is decoding your audio..."
                  : isUploadingFile
                  ? "Uploading file to Vex..."
                  : isGeneratingImage
                  ? "Vex is painting your reality..."
                  : "Uploading image to Vex..."}
              </Text>
              <ActivityIndicator size="small" color={C.neon} />
            </View>
          )}

          {/* Text input row */}
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { height: Math.max(44, Math.min(inputHeight, 120)) }]}
              value={inputText}
              onChangeText={setInputText}
              onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height + 20)}
              placeholder="Ask Vex anything..."
              placeholderTextColor={C.neonFaint}
              multiline
              maxLength={1500}
              returnKeyType="default"
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
                <ActivityIndicator size="small" color={C.black} />
              ) : (
                <Text style={styles.sendIcon}>▶</Text>
              )}
            </Pressable>
          </View>

          {inputText.length > 1200 && (
            <Text style={styles.charCount}>{1500 - inputText.length} chars left</Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Roleplay Mode Modal */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModeModal(false)}>
          <View style={styles.modalSheet}>
            <LinearGradient
              colors={[C.surface, C.deepBlack]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.modalHandle} />
            <Image source={{ uri: VEX_ASSETS.logo }} style={styles.modalVexLogo} />
            <Text style={styles.modalTitle}>SELECT VEX MODE</Text>
            <Text style={styles.modalSubtitle}>Each mode unlocks a different side of Kora Vex</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(ROLEPLAY_MODES).map(([key, mode]) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.modeOption,
                    currentMode === key && styles.modeOptionActive,
                    pressed && { opacity: 0.75 },
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
                  {currentMode === key && (
                    <View style={styles.modeCheckWrap}>
                      <Text style={styles.modeCheckmark}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },
  flex: { flex: 1 },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: C.neon,
  },
  loadingGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: C.neonGlow,
    top: "50%",
    marginTop: -80,
  },
  loadingText: {
    color: C.neon,
    fontFamily: MONO,
    marginTop: 20,
    letterSpacing: 4,
    fontSize: 14,
    fontWeight: "800",
  },
  loadingSubtext: {
    color: C.textMid,
    fontFamily: MONO,
    marginTop: 8,
    fontSize: 13,
    letterSpacing: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,4,0,0.92)",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,255,65,0.15)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarContainer: { position: "relative", width: 48, height: 48 },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: C.neon,
  },
  avatarRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: C.neonGlow,
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { marginLeft: 12, flex: 1 },
  headerName: {
    color: C.neon,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: MONO,
    letterSpacing: 3,
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.neon,
  },
  statusText: {
    color: C.textMid,
    fontSize: 11,
    fontFamily: MONO,
    letterSpacing: 1,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 7 },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.neon,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 3,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  coinIcon: { fontSize: 11 },
  coinText: { color: C.neon, fontSize: 12, fontWeight: "800", fontFamily: MONO },
  streakBadge: {
    backgroundColor: "#120800",
    borderWidth: 1.5,
    borderColor: C.orange,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakText: { color: C.orange, fontSize: 12, fontWeight: "800" },
  headerBtn: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: { color: C.neon, fontSize: 15, fontWeight: "900" },
  modePill: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.neon,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modePillText: { color: C.neon, fontSize: 10, fontWeight: "900", letterSpacing: 2 },

  // Neon divider
  neonDivider: { height: 1, opacity: 0.6 },

  // News ticker
  tickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tickerLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  tickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.neon,
  },
  tickerLabel: {
    color: C.neon,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: MONO,
  },
  tickerScroll: { flex: 1, overflow: "hidden" },
  tickerText: { color: C.bodyText, fontSize: 11, fontFamily: MONO, letterSpacing: 0.3 },

  // Coin toast
  coinToast: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.neon,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 200,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  coinToastText: { color: C.neon, fontSize: 13, fontWeight: "900", fontFamily: MONO },

  // Messages
  messageList: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12 },
  messageRow: { flexDirection: "row", marginBottom: 16, alignItems: "flex-end" },
  vexRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  typingAvatarWrap: { position: "relative", marginRight: 10, flexShrink: 0 },
  vexAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.neon,
  },
  avatarGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 21,
    backgroundColor: C.neonGlow,
  },
  bubbleColumn: { maxWidth: "80%", gap: 5 },
  vexBubbleColumn: { alignItems: "flex-start" },
  userBubbleColumn: { alignItems: "flex-end" },
  messageImage: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.neon,
    marginBottom: 6,
  },
  vexBubble: {
    backgroundColor: "rgba(1,12,1,0.88)",
    borderWidth: 1.5,
    borderColor: C.neonDim,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 11,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  userBubble: {
    backgroundColor: C.neon,
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 11,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  vexText: { color: C.bodyText, fontFamily: MONO, fontSize: 14, lineHeight: 23 },
  vexTextBold: { fontWeight: "900", color: "#44FF66" },
  userText: { color: C.black, fontWeight: "700", fontSize: 14, lineHeight: 22 },

  // Action row
  actionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" },
  actionRowLeft: { justifyContent: "flex-start" },
  actionRowRight: { justifyContent: "flex-end" },
  actionBtn: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  actionBtnActive: { borderColor: C.neon },
  actionBtnText: { color: C.textMid, fontSize: 11, fontFamily: MONO },
  timestampText: { color: C.textDim, fontSize: 10, fontFamily: MONO },

  // Typing indicator
  typingRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 14, marginBottom: 12 },
  typingBubble: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.neonDim,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 5,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  typingDots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.neon,
  },
  typingLabel: { color: C.textMid, fontSize: 11, fontFamily: MONO, letterSpacing: 0.5 },

  // Scroll to bottom
  scrollBtn: {
    position: "absolute",
    bottom: 90,
    right: 16,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.neon,
    borderRadius: 22,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  scrollBtnText: { color: C.neon, fontSize: 17, fontWeight: "900" },

  // Pending image
  pendingImageContainer: { marginHorizontal: 14, marginBottom: 10, position: "relative" },
  pendingImage: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.neon,
  },
  removePendingImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: C.black,
    borderRadius: 14,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.neon,
  },
  removePendingImageText: { color: C.neon, fontSize: 12, fontWeight: "900" },
  pendingImageLabel: { color: C.textMid, fontSize: 11, marginTop: 5, textAlign: "center", fontFamily: MONO },

  // Input area
  inputArea: {
    backgroundColor: "rgba(0,4,0,0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,255,65,0.2)",
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  inputToolbar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  toolbarBtn: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  toolbarBtnActive: { borderColor: C.neon, backgroundColor: C.surfaceHigh },
  toolbarBtnRecording: { borderColor: C.red, backgroundColor: "#1a0000" },
  toolbarBtnIcon: { fontSize: 18 },
  toolbarBtnLabel: { color: C.textMid, fontSize: 9, fontFamily: MONO, letterSpacing: 0.5 },

  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  statusIndicatorText: { color: C.bodyText, fontSize: 12, fontFamily: MONO, flex: 1 },

  inputWrapper: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    color: C.neon,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: MONO,
  },
  sendButton: {
    backgroundColor: C.neon,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButtonPressed: { opacity: 0.8, transform: [{ scale: 0.93 }] },
  sendButtonDisabled: { opacity: 0.2, shadowOpacity: 0 },
  sendIcon: { color: C.black, fontSize: 17, fontWeight: "900" },
  charCount: { color: C.orange, fontSize: 10, fontFamily: MONO, textAlign: "right", marginTop: 4 },

  // Mode modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopWidth: 2,
    borderTopColor: C.neon,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingTop: 16,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalVexLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: C.neon,
  },
  modalTitle: {
    color: C.neon,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    fontFamily: MONO,
  },
  modalSubtitle: {
    color: C.textMid,
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 18,
    fontFamily: MONO,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 14,
    marginBottom: 9,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  modeOptionActive: {
    borderColor: C.neon,
    backgroundColor: C.surfaceHigh,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modeOptionEmoji: { fontSize: 28, marginRight: 14 },
  modeOptionInfo: { flex: 1 },
  modeOptionLabel: { color: C.bodyText, fontSize: 14, fontWeight: "700", fontFamily: MONO },
  modeOptionLabelActive: { color: C.neon },
  modeOptionDesc: { color: C.textMid, fontSize: 12, marginTop: 3, lineHeight: 18 },
  modeCheckWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.neon,
    alignItems: "center",
    justifyContent: "center",
  },
  modeCheckmark: { color: C.black, fontSize: 14, fontWeight: "900" },

  // Neon border utility
  neonBorderOuter: {
    borderWidth: 1.5,
    borderColor: C.neon,
    borderRadius: 14,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  // HUD corner accents for spaceship aesthetic
  hudCornerTL: {
    position: "absolute" as const,
    top: 40,
    left: 20,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: C.neon,
  },
  hudCornerTR: {
    position: "absolute" as const,
    top: 40,
    right: 20,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: C.neon,
  },
  hudCornerBL: {
    position: "absolute" as const,
    bottom: 100,
    left: 20,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: C.neon,
  },
  hudCornerBR: {
    position: "absolute" as const,
    bottom: 100,
    right: 20,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: C.neon,
  },
});
