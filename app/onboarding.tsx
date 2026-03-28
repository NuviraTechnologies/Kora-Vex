import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

const NEO_GREEN = "#00FF41";
const GOLD = "#FFD700";

const COSMIC_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663467303048/KHyhVJjWGJuAogbSjvLteH/vex-cosmic-bg-Mxma3NGMuSJqhBzhVmN3dy.webp";
const VEX_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663467303048/dHXXSRpjxNJOTpMX.webp";

const SLIDES = [
  {
    key: "intro",
    vexImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663467303048/wNUUohlJZyKyvILt.png",
    subtitle: "GALACTIC INTELLIGENCE UNIT",
    title: "KORA VEX",
    body: "Crash-landed on Earth in 1972. Watched you go from 8-tracks to TikTok. Still waiting for a rescue that isn't coming. Might as well talk.",
    accent: NEO_GREEN,
  },
  {
    key: "personality",
    vexImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663467303048/apNPGCrXlQzqcJMf.png",
    subtitle: "HYPER-INTELLIGENT · SARCASTICALLY SO",
    title: "A REAL\nALIEN MIND",
    body: "Knows every alien race, conspiracy, and civilization type. Will explain the Kardashev Scale and then roast your WiFi password in the same breath.",
    accent: NEO_GREEN,
  },
  {
    key: "features",
    vexImage: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663467303048/hFWXRirUjHlvebYX.png",
    subtitle: "FULL ENTERTAINMENT EXPERIENCE",
    title: "EVERY BELL\n& WHISTLE",
    body: "Chat. Roleplay. Upload photos for Vex to analyze. Explore alien lore. Earn VEX Coins. Hear him speak. He's been waiting 50+ years for someone worth talking to.",
    accent: GOLD,
  },
];

// Generate stars once
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.6 + 0.2,
  speed: Math.random() * 2000 + 1500,
}));

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(0))).current;
  const imageFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Star twinkle
    starAnims.forEach((anim, i) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: STARS[i].speed, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: STARS[i].speed, useNativeDriver: true }),
        ]).start(() => twinkle());
      };
      setTimeout(() => twinkle(), i * 40);
    });

    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      Animated.timing(imageFade, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    // Glow pulse
    const pulse = () => {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  const goToSlide = (index: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(imageFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(index);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(imageFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("kv_onboarding_done", "true");
    router.replace("/(tabs)");
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Cosmic background image */}
      <Animated.Image
        source={{ uri: COSMIC_BG }}
        style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
        resizeMode="cover"
      />

      {/* Star field overlay */}
      {STARS.map((star, i) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: starAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, star.opacity],
              }),
            },
          ]}
        />
      ))}

      {/* Dark overlay for readability */}
      <View style={styles.darkOverlay} />

      {/* Vex character — upper portion */}
      <Animated.Image
        source={{ uri: slide.vexImage }}
        style={[styles.vexCharacter, { opacity: imageFade }]}
        resizeMode="cover"
      />

      {/* Bottom fade over character image */}
      <View style={styles.characterFade} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <View style={styles.logoWrapper}>
            <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
            <Image source={{ uri: VEX_LOGO }} style={styles.topLogo} resizeMode="contain" />
          </View>
        </Animated.View>
        <TouchableOpacity onPress={handleGetStarted} style={styles.skipButton}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Content panel */}
      <Animated.View style={[styles.contentPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: slide.accent }]} />

        <Text style={[styles.slideSubtitle, { color: slide.accent }]}>{slide.subtitle}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideBody}>{slide.body}</Text>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View style={[styles.dot, i === currentSlide && { ...styles.dotActive, backgroundColor: slide.accent }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, { borderColor: slide.accent }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.ctaBg, { backgroundColor: slide.accent, opacity: glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.06, 0.14] }) }]} />
          <Text style={[styles.ctaText, { color: slide.accent }]}>
            {currentSlide < SLIDES.length - 1 ? "NEXT  →" : "ENTER THE GALAXY  →"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.finePrint}>Kid-friendly · All ages · Powered by alien intelligence</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  vexCharacter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: width,
    height: height * 0.58,
  },
  characterFade: {
    position: "absolute",
    bottom: height * 0.38,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: "transparent",
    // Simulated bottom fade
    borderBottomWidth: 0,
  },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 20,
  },
  logoWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00FF41",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  topLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#00FF41",
    zIndex: 1,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1A2A1A",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  skipText: {
    color: "#8A9BA8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  contentPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.93)",
    borderTopWidth: 1,
    borderTopColor: "#0A1F0A",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  accentBar: {
    width: 44,
    height: 3,
    borderRadius: 2,
    marginBottom: 14,
  },
  slideSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  slideTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
    lineHeight: 36,
    marginBottom: 12,
  },
  slideBody: {
    color: "#9AB09A",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1A2A1A",
  },
  dotActive: {
    width: 28,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
  },
  ctaBg: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  finePrint: {
    color: "#2A3A2A",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
