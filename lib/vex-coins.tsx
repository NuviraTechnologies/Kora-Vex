import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COINS_KEY = "kv_coins";
const STREAK_KEY = "kv_streak";
const LAST_CHAT_KEY = "kv_last_chat_date";

interface VexCoinsState {
  coins: number;
  streak: number;
  addCoins: (amount: number, reason?: string) => void;
  lastEarnReason: string | null;
}

const VexCoinsContext = createContext<VexCoinsState>({
  coins: 0,
  streak: 0,
  addCoins: () => {},
  lastEarnReason: null,
});

export function VexCoinsProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastEarnReason, setLastEarnReason] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const storedCoins = await AsyncStorage.getItem(COINS_KEY);
      const storedStreak = await AsyncStorage.getItem(STREAK_KEY);
      const lastChatDate = await AsyncStorage.getItem(LAST_CHAT_KEY);

      if (storedCoins) setCoins(parseInt(storedCoins, 10));

      // Update streak based on last chat date
      const today = new Date().toDateString();
      if (lastChatDate) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastChatDate === today) {
          // Same day — keep streak
          if (storedStreak) setStreak(parseInt(storedStreak, 10));
        } else if (lastChatDate === yesterday) {
          // Consecutive day — streak continues
          const newStreak = (storedStreak ? parseInt(storedStreak, 10) : 0) + 1;
          setStreak(newStreak);
          await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
          await AsyncStorage.setItem(LAST_CHAT_KEY, today);
        } else {
          // Streak broken
          setStreak(1);
          await AsyncStorage.setItem(STREAK_KEY, "1");
          await AsyncStorage.setItem(LAST_CHAT_KEY, today);
        }
      } else {
        // First time
        setStreak(1);
        await AsyncStorage.setItem(STREAK_KEY, "1");
        await AsyncStorage.setItem(LAST_CHAT_KEY, today);
      }
    };
    load();
  }, []);

  const addCoins = useCallback(async (amount: number, reason?: string) => {
    setCoins((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(COINS_KEY, next.toString());
      return next;
    });
    if (reason) {
      setLastEarnReason(reason);
      setTimeout(() => setLastEarnReason(null), 3000);
    }
  }, []);

  return (
    <VexCoinsContext.Provider value={{ coins, streak, addCoins, lastEarnReason }}>
      {children}
    </VexCoinsContext.Provider>
  );
}

export function useVexCoins() {
  return useContext(VexCoinsContext);
}
