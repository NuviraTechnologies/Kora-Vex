import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Platform, Animated, Pressable } from "react-native";
import { useRef, useEffect } from "react";

// Neon green palette — matches chat screen
const C = {
  neon: "#00FF41",
  neonDim: "#00CC33",
  neonFaint: "#001a00",
  black: "#000000",
  surface: "#020f02",
  border: "#003300",
  textDim: "#004400",
  textMid: "#00AA28",
};

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
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(glowAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 0.9,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
      }),
    ]).start();
  }, [focused]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  return (
    <View style={tabStyles.iconContainer}>
      {/* Glow halo behind icon */}
      <Animated.View
        style={[
          tabStyles.glowHalo,
          { opacity: glowOpacity },
        ]}
      />

      {/* Icon + label */}
      <Animated.View
        style={[tabStyles.iconInner, { transform: [{ scale: scaleAnim }] }]}
      >
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

      {/* Active indicator dot */}
      {focused && <View style={tabStyles.activeDot} />}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 10);
  const tabBarHeight = 68 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: "#000000",
          borderTopWidth: 1.5,
          borderTopColor: "#003300",
          paddingTop: 8,
          paddingBottom: bottomPadding,
          elevation: 0,
        },
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
            <TabIcon icon="⚙️" label="SETTINGS" focused={focused} />
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
    width: 72,
    height: 52,
    position: "relative",
  },
  glowHalo: {
    position: "absolute",
    width: 60,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00FF41",
    top: 0,
    alignSelf: "center",
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconEmoji: {
    fontSize: 24,
    opacity: 0.45,
  },
  iconEmojiActive: {
    opacity: 1,
  },
  iconLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  iconLabelActive: {
    color: "#00FF41",
  },
  iconLabelInactive: {
    color: "#004400",
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00FF41",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
