import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Platform, Animated, ImageBackground } from "react-native";
import { useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";

// Spaceship cockpit palette
const C = {
  neon: "#00FF41",
  neonDim: "#00CC33",
  neonFaint: "#001a00",
  neonGlow: "#00FF4122",
  black: "#000000",
  deepBlack: "#000500",
  surface: "#010a01",
  border: "#003300",
  borderBright: "#00FF41",
  textDim: "#004400",
  textMid: "#00AA28",
  teal: "#00FFCC",
  tealDim: "#004433",
};

const SPACESHIP_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663467303048/KHyhVJjWGJuAogbSjvLteH/spaceship-bg-LWxcsaZVsX5si8soN8wURD.webp";

function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) {
  const glowAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.88)).current;
  const borderAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(glowAnim, {
        toValue: focused ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.08 : 0.88,
        useNativeDriver: true,
        damping: 14,
        stiffness: 220,
      }),
      Animated.timing(borderAnim, {
        toValue: focused ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.border, C.neon],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  return (
    <View style={tabStyles.iconContainer}>
      {/* Glow halo */}
      <Animated.View style={[tabStyles.glowHalo, { opacity: glowOpacity }]} />

      {/* HUD panel border */}
      <Animated.View
        style={[
          tabStyles.hudPanel,
          { borderColor, borderWidth },
        ]}
      >
        <Animated.View style={[tabStyles.iconInner, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={[tabStyles.iconEmoji, focused && tabStyles.iconEmojiActive]}>
            {icon}
          </Text>
          <Text
            style={[
              tabStyles.iconLabel,
              focused ? tabStyles.iconLabelActive : tabStyles.iconLabelInactive,
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Active scan line */}
      {focused && (
        <View style={tabStyles.scanLine} />
      )}

      {/* Corner accents when active */}
      {focused && (
        <>
          <View style={[tabStyles.cornerTL]} />
          <View style={[tabStyles.cornerTR]} />
        </>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);
  const tabBarHeight = 72 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          elevation: 0,
          position: "absolute",
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {/* Spaceship cockpit console background */}
            <ImageBackground
              source={{ uri: SPACESHIP_BG }}
              style={StyleSheet.absoluteFill}
              imageStyle={{ opacity: 0.18, resizeMode: "cover" }}
            />
            {/* Dark overlay */}
            <LinearGradient
              colors={["rgba(0,5,0,0.96)", "rgba(0,8,0,0.99)"]}
              style={StyleSheet.absoluteFill}
            />
            {/* Top neon border — HUD panel edge */}
            <View style={tabStyles.topBorder} />
            {/* Subtle scan line effect */}
            <View style={tabStyles.scanLineOverlay} />
            {/* Corner HUD accents */}
            <View style={tabStyles.hudCornerLeft} />
            <View style={tabStyles.hudCornerRight} />
          </View>
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: C.neon,
        tabBarInactiveTintColor: C.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👾" label="CHAT" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="lore"
        options={{
          title: "Lore",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🛸" label="LORE" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️" label="VEX" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    height: 54,
    position: "relative",
  },
  glowHalo: {
    position: "absolute",
    width: 64,
    height: 46,
    borderRadius: 10,
    backgroundColor: C.neon,
    top: 0,
    alignSelf: "center",
  },
  hudPanel: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(0,10,0,0.6)",
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  iconEmojiActive: {
    opacity: 1,
  },
  iconLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  iconLabelActive: {
    color: C.neon,
  },
  iconLabelInactive: {
    color: C.textDim,
  },
  scanLine: {
    position: "absolute",
    bottom: 0,
    width: 40,
    height: 2,
    backgroundColor: C.neon,
    borderRadius: 1,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 6,
    width: 8,
    height: 8,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: C.neon,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 6,
    width: 8,
    height: 8,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: C.neon,
  },
  // Tab bar background elements
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: C.neon,
    shadowColor: C.neon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  scanLineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,255,65,0.06)",
  },
  hudCornerLeft: {
    position: "absolute",
    top: 4,
    left: 12,
    width: 16,
    height: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(0,255,65,0.4)",
  },
  hudCornerRight: {
    position: "absolute",
    top: 4,
    right: 12,
    width: 16,
    height: 16,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0,255,65,0.4)",
  },
});
