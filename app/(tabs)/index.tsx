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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const CHAT_STORAGE_KEY = "kv_chat_history";
const ONBOARDING_KEY = "kv_onboarding_done";

const VEX_GREETINGS = [
  "Oh. You again. Or... you for the first time. Either way, I'm Kora Vex. Alien. Genius. Stranded on your delightful little rock. Ask me anything — I've seen civilizations rise and fall while you were still figuring out fire.",
  "Well, well. A human decided to make contact. Bold choice. I'm Kora Vex — crashed here 23 years ago, still waiting on my rescue ship. In the meantime, I suppose I can entertain your questions.",
  "Initiating communication with... *scans*... a human. Fascinating. I'm Kora Vex. My IQ is untranslatable to your number system, but let's just say I'm smarter than everything on this planet combined. What do you want?",
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
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
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
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

function MessageBubble({ message }: { message: Message }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const isVex = message.role === "assistant";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
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
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.vexAvatar}
        />
      )}
      <View
        style={[
          styles.bubble,
          isVex ? styles.vexBubble : styles.userBubble,
        ]}
      >
        <Text style={[styles.bubbleText, isVex ? styles.vexText : styles.userText]}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = trpc.chat.sendMessage.useMutation();

  // Check onboarding and load chat history
  useEffect(() => {
    const init = async () => {
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboardingDone) {
        router.replace("/onboarding");
        return;
      }

      const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        setMessages(parsed);
      } else {
        // First time — show Vex greeting
        const greeting: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: VEX_GREETINGS[Math.floor(Math.random() * VEX_GREETINGS.length)],
          timestamp: Date.now(),
        };
        setMessages([greeting]);
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([greeting]));
      }
      setIsInitialized(true);
    };
    init();
  }, []);

  const saveMessages = useCallback(async (msgs: Message[]) => {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText("");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Build conversation history for context (last 20 messages)
      const history = updatedMessages.slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await chatMutation.mutateAsync({ messages: history });

      const vexMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, vexMsg];
      setMessages(finalMessages);
      await saveMessages(finalMessages);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "My communication array is experiencing interference. Probably your planet's terrible WiFi. Try again, human.",
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      await saveMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, chatMutation, saveMessages]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF41" />
        <Text style={styles.loadingText}>ESTABLISHING CONTACT...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>KORA VEX</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ONLINE · SLIGHTLY ANNOYED</Text>
          </View>
        </View>
      </View>

      <View style={styles.headerDivider} />

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
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Input area */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#00FF41",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    letterSpacing: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#00FF41",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#00FF41",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 3,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    textShadowColor: "#00FF41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FF41",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusText: {
    color: "#4A7A4A",
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "#1A2A1A",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  vexRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  vexAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#00FF41",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  vexBubble: {
    backgroundColor: "#0D1A0D",
    borderWidth: 1,
    borderColor: "#1A3A1A",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#0A1F0A",
    borderWidth: 1,
    borderColor: "#1A3A1A",
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  vexText: {
    color: "#C8FFC8",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  userText: {
    color: "#E0FFE0",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  typingDots: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FF41",
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1A2A1A",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#0D1117",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A3A1A",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: "#E0FFE0",
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00FF41",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.85,
  },
  sendButtonDisabled: {
    backgroundColor: "#1A3A1A",
    shadowOpacity: 0,
  },
  sendIcon: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 2,
  },
});
