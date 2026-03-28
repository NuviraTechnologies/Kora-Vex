import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

const NUM_STARS = 80;

function generateStars() {
  return Array.from({ length: NUM_STARS }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.5 + 0.5,
    opacity: Math.random() * 0.7 + 0.3,
    speed: Math.random() * 2000 + 1000,
  }));
}

const STARS = generateStars();

export default function OnboardingScreen() {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Animate stars twinkling
    starAnims.forEach((anim, i) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: STARS[i].speed,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: STARS[i].speed,
            useNativeDriver: true,
          }),
        ]).start(() => twinkle());
      };
      setTimeout(() => twinkle(), i * 30);
    });

    // Logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse
    const pulsGlow = () => {
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulsGlow());
    };
    pulsGlow();
  }, []);

  const handleMakeContact = async () => {
    await AsyncStorage.setItem("kv_onboarding_done", "true");
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Star field */}
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
                outputRange: [0.1, star.opacity],
              }),
            },
          ]}
        />
      ))}

      {/* Logo glow halo */}
      <Animated.View style={[styles.glowHalo, { opacity: glowOpacity }]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text content */}
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.title}>KORA VEX</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>
          An alien. A genius.{"\n"}Slightly annoyed by your existence.
        </Text>
        <Text style={styles.description}>
          Crash-landed on Earth 23 years ago.{"\n"}
          Still waiting for a rescue that isn't coming.{"\n"}
          Might as well talk to you.
        </Text>
      </Animated.View>

      {/* CTA Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
          onPress={handleMakeContact}
        >
          <Text style={styles.ctaText}>MAKE CONTACT</Text>
        </Pressable>
        <Text style={styles.disclaimer}>
          Warning: Kora Vex may make you question everything you know.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
  glowHalo: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "transparent",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 0,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 160,
    height: 160,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#00FF41",
    letterSpacing: 8,
    textShadowColor: "#00FF41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    fontFamily: "monospace",
  },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: "#00FF41",
    marginVertical: 16,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#E0FFE0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: "italic",
  },
  description: {
    fontSize: 13,
    color: "#4A7A4A",
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  ctaButton: {
    borderWidth: 1.5,
    borderColor: "#00FF41",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 4,
    backgroundColor: "rgba(0, 255, 65, 0.08)",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonPressed: {
    backgroundColor: "rgba(0, 255, 65, 0.2)",
    transform: [{ scale: 0.97 }],
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#00FF41",
    letterSpacing: 4,
    fontFamily: "monospace",
    textShadowColor: "#00FF41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 11,
    color: "#2A4A2A",
    textAlign: "center",
    fontStyle: "italic",
  },
});
