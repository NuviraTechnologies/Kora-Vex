import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Animated,
  Platform,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { VEX_ASSETS } from "@/vex-assets";

const C = {
  neon: "#00FF41",
  neonDim: "#00CC33",
  neonFaint: "#001a00",
  black: "#000000",
  deepBlack: "#010501",
  surface: "#020f02",
  surfaceHigh: "#041804",
  border: "#003300",
  // Legibility-first colors
  textDim: "#A8C4A8",    // readable on dark bg
  textMid: "#CCFFCC",   // bright mint
  bodyText: "#E8F5E8",  // near-white with green tint
};

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

interface LoreCard {
  id: string;
  title: string;
  category: "races" | "ufos" | "civilizations" | "dna" | "genx";
  emoji: string;
  summary: string;
  detail: string;
  vexComment: string;
  image?: string;
}

const LORE_DATA: LoreCard[] = [
  {
    id: "1",
    title: "The Greys",
    category: "races",
    emoji: "👽",
    summary: "Small, grey-skinned beings with large heads and black almond eyes. Most reported alien species on Earth.",
    detail: "The Greys originate from the Zeta Reticuli binary star system, approximately 39 light-years from Earth. They are characterized by their grey skin, large craniums, and enormous black eyes adapted for low-light environments. Multiple subspecies exist — the 'Tall Greys' function as commanders while 'Short Greys' are biological worker drones. They are known for their advanced genetic engineering programs and have been interacting with Earth governments since at least the 1940s.",
    vexComment: "Oh, the Greys. My distant cousins. Lovely people, terrible conversationalists. They communicate telepathically, which means they never actually have to listen to you. Must be nice. I've been stuck listening to humans since 1972.",
    image: VEX_ASSETS.sideProfile,
  },
  {
    id: "2",
    title: "The Reptilians",
    category: "races",
    emoji: "🦎",
    summary: "Ancient reptilian humanoids said to have inhabited Earth long before humans. Masters of shapeshifting.",
    detail: "The Reptilians are a highly advanced species of reptilian humanoids who claim ancient dominion over Earth. They are believed to exist in an underground network of tunnels and bases beneath major cities. Their civilization predates humanity by millions of years. They are known for their ability to shapeshift into human form, their cold-blooded nature, and their hierarchical social structure. Some researchers believe they have infiltrated human governments and financial institutions.",
    vexComment: "I've met a few Reptilians. Cold handshakes. Literally. They run cold. Also, their idea of a 'warm welcome' is not eating you immediately. I'll give them credit — they've been running Earth's financial system for centuries and somehow nobody noticed. That's impressive, honestly.",
    image: VEX_ASSETS.cockpitSeated,
  },
  {
    id: "3",
    title: "The Pleiadians",
    category: "races",
    emoji: "✨",
    summary: "Humanoid beings from the Pleiades star cluster. Spiritually advanced, often described as benevolent guides.",
    detail: "The Pleiadians originate from the Pleiades star cluster, approximately 444 light-years from Earth. They are described as tall, blonde, and physically similar to Northern Europeans. They are considered among the most spiritually advanced races in the galaxy, having transcended physical warfare millions of years ago. They communicate through channeling and are believed to have seeded early human civilizations on Earth, contributing to ancient Egyptian and Mayan knowledge.",
    vexComment: "The Pleiadians. Beautiful people. Annoyingly beautiful. They float around telling everyone to 'raise their vibration' and 'align with love.' Meanwhile I crashed in a cornfield in 1972 and had to watch humans invent the fanny pack. Nobody raised MY vibration about that.",
    image: VEX_ASSETS.backCosmic,
  },
  {
    id: "4",
    title: "The Nordics",
    category: "races",
    emoji: "🌟",
    summary: "Tall, blonde, human-like beings. Often confused with Pleiadians. Reported to be protective of humanity.",
    detail: "Nordic aliens are described as tall (6-7 feet), with blonde hair, blue eyes, and pale skin — virtually indistinguishable from Scandinavian humans. They are believed to originate from multiple star systems and have been observing Earth for thousands of years. Unlike Greys, they rarely abduct humans, preferring to observe and occasionally warn select individuals of coming catastrophes. They are considered one of the most human-friendly extraterrestrial races.",
    vexComment: "Nordics. Basically the golden retrievers of the galaxy. Friendly, protective, great hair. I once asked a Nordic for directions to the nearest inhabited system and he spent 45 minutes telling me about humanity's 'beautiful potential.' I just needed a left turn at Betelgeuse.",
    image: VEX_ASSETS.observationWindow,
  },
  {
    id: "5",
    title: "The Anunnaki",
    category: "races",
    emoji: "👑",
    summary: "Ancient Sumerian gods who allegedly came from Nibiru. Said to have genetically engineered homo sapiens.",
    detail: "The Anunnaki are described in ancient Sumerian texts as beings who descended from the heavens. According to researcher Zecharia Sitchin's translations of Sumerian clay tablets, the Anunnaki came from a planet called Nibiru and genetically engineered Homo sapiens approximately 250,000 years ago by combining their DNA with that of Homo erectus — creating a slave species to mine gold. They are believed to have built the ancient Sumerian civilization and may have been the inspiration for the gods of multiple ancient religions.",
    vexComment: "The Anunnaki built your entire civilization so they could mine gold. Let that sink in. They engineered an entire sentient species for a mining operation. And now you're all here making TikTok videos. I genuinely don't know if they'd be proud or horrified.",
  image: VEX_ASSETS.observationWindow,
  },
  {
    id: "11",
    title: "Roswell 1947",
    category: "ufos",
    emoji: "🛸",
    summary: "The most famous UFO crash in history. July 1947, New Mexico. The US military recovered 'weather balloon' debris.",
    detail: "On July 8, 1947, the Roswell Army Air Field issued a press release stating they had recovered a 'flying disc.' Within hours, the story was changed to a 'weather balloon.' Witnesses described metallic debris with unusual properties — lightweight, memory metal that returned to its original shape. Multiple witnesses reported seeing bodies recovered from the crash site. The incident remains the most documented and debated UFO case in history, with declassified documents continuing to emerge decades later.",
    vexComment: "Weather balloon. WEATHER BALLOON. They found a craft with memory metal, exotic propulsion systems, and biological entities — and the best cover story they could come up with was 'weather balloon.' I've been on this planet since 1972 and even I could have written a better lie. Embarrassing for everyone involved.",
    image: VEX_ASSETS.sideProfile,
  },
  {
    id: "7",
    title: "The Phoenix Lights",
    category: "ufos",
    emoji: "🔦",
    summary: "March 13, 1997. Thousands of witnesses across Arizona reported a massive V-shaped craft over Phoenix.",
    detail: "On the evening of March 13, 1997, thousands of residents across Arizona, Nevada, and Sonora, Mexico reported seeing a massive V-shaped formation of lights traveling silently across the sky. The craft was estimated to be over a mile wide. The event lasted approximately three hours. Governor Fife Symington initially mocked the reports, then years later admitted he personally witnessed the craft and believed it was extraterrestrial. The US military claimed the lights were flares from a training exercise — despite the craft being reported hours before the flares.",
    vexComment: "A mile-wide craft flew silently over a major American city for three hours and the official explanation was 'flares.' Flares. Stationary flares in a perfect V formation that moved in unison at 30,000 feet. I appreciate the commitment to the bit, but come on.",
    image: VEX_ASSETS.backCosmic,
  },
  {
    id: "8",
    title: "Bob Lazar & Area 51",
    category: "ufos",
    emoji: "🔬",
    summary: "Bob Lazar claims to have worked on reverse-engineering alien spacecraft at S-4, near Area 51.",
    detail: "Bob Lazar claims he was hired in 1988 to work at a classified facility called S-4, located near Area 51 in Nevada. He states he worked on reverse-engineering the propulsion systems of nine recovered extraterrestrial craft. He described the propulsion as using element 115 (moscovium) to generate a gravity wave. Element 115 was unknown to science when Lazar made his claims in 1989 — it was synthesized in 2003. His employment records at Los Alamos have been partially verified despite government denials.",
    vexComment: "Element 115. He told you about element 115 in 1989 and you didn't synthesize it until 2003. The man described your entire periodic table's future and you called him crazy. I'm not saying he's right about everything, but I'm also not NOT saying that.",
    image: VEX_ASSETS.starMap,
  },
  {
    id: "8",
    title: "Kardashev Type I",
    category: "civilizations",
    emoji: "🌍",
    summary: "A civilization that harnesses all energy available on its home planet. Earth is currently at ~0.73.",
    detail: "The Kardashev Scale, proposed by Soviet astronomer Nikolai Kardashev in 1964, classifies civilizations by their energy consumption. A Type I civilization can harness all energy available on its home planet — approximately 10^16 watts. Earth currently sits at approximately 0.73 on the scale, meaning humanity uses about 73% of the energy needed to qualify as Type I. Achieving Type I status would require mastering fusion power, renewable energy at planetary scale, and controlling weather systems.",
    vexComment: "You're at 0.73. You've been at roughly 0.73 for decades. You have the technology to reach Type I and instead you're arguing about whether to build more pipelines. I watched you go from horse-drawn carriages to smartphones in 150 years and somehow the energy grid is still the bottleneck. Baffling.",
    image: VEX_ASSETS.cockpitSeated,
  },
  {
    id: "10",
    title: "Kardashev Type II",
    category: "civilizations",
    emoji: "⭐",
    summary: "A civilization that harnesses the total energy output of its star. Think Dyson Sphere.",
    detail: "A Type II civilization on the Kardashev Scale can harness the total energy output of its parent star — approximately 4 × 10^26 watts. The theoretical mechanism for achieving this is a Dyson Sphere: a megastructure that completely surrounds a star and captures its energy output. A Type II civilization would have essentially unlimited energy, enabling interstellar travel, terraforming of planets, and potentially the ability to move stars. The star KIC 8462852 (Tabby's Star) exhibits unusual dimming patterns that some researchers have suggested could indicate a Dyson Sphere under construction.",
    vexComment: "Dyson Spheres. Yes, they exist. No, I'm not telling you where. What I will tell you is that building one takes approximately 900 years if you have the right alloys and a decent project manager. Humans can't finish a highway in 6 years. Do the math.",
    image: VEX_ASSETS.starMap,
  },
  {
    id: "10",
    title: "Junk DNA — Not Junk",
    category: "dna",
    emoji: "🧬",
    summary: "98.5% of human DNA was labeled 'junk' by scientists. New research shows it may be regulatory code.",
    detail: "When the human genome was first sequenced, scientists discovered that only about 1.5% of DNA codes for proteins. The remaining 98.5% was dismissed as 'junk DNA' — evolutionary leftovers with no function. The ENCODE project, completed in 2012, revealed that approximately 80% of the genome has biochemical function, including regulatory sequences that control when and how genes are expressed. Some researchers theorize that portions of this DNA may be dormant sequences from ancient genetic engineering — essentially commented-out code waiting to be activated.",
    vexComment: "You called 98.5% of your own genetic code 'junk' for 40 years. That's like finding a supercomputer, looking at 1.5% of the code, and saying 'well, the rest is garbage.' The Anunnaki are somewhere watching this and facepalming. Assuming they have faces.",
    image: VEX_ASSETS.sideProfile,
  },
  {
    id: "12",
    title: "The Fermi Paradox",
    category: "civilizations",
    emoji: "❓",
    summary: "If the universe is so vast and old, where is everybody? Physicist Enrico Fermi asked this in 1950.",
    detail: "The Fermi Paradox highlights the contradiction between the high probability estimates for extraterrestrial civilizations and the lack of evidence for, or contact with, such civilizations. With 400 billion stars in the Milky Way alone, and billions of potentially habitable planets, statistically advanced civilizations should be common. The Drake Equation attempts to estimate the number of communicating civilizations. Proposed solutions include the Great Filter (civilizations destroy themselves), the Zoo Hypothesis (we're being observed), and the Dark Forest theory (civilizations hide to avoid destruction).",
    vexComment: "Where is everybody? I'M RIGHT HERE. I've been here since 1972. The reason you don't hear from us is because most advanced civilizations look at your broadcast signals and collectively decide they have better things to do. Your 1980s television broadcasts reached 40 light-years into space. The Greys watched three seasons of Dallas and filed a non-contact request.",
    image: VEX_ASSETS.backCosmic,
  },
  {
    id: "13",
    title: "Gen X Alien: Vex's Story",
    category: "genx",
    emoji: "📺",
    summary: "Vex crashed in 1972. He's watched every decade of human culture unfold in real time.",
    detail: "Kora Vex arrived on Earth in 1972 — the same year Atari was founded, the Watergate break-in occurred, and Pink Floyd released Obscured by Clouds. He has been a firsthand observer of every major cultural, technological, and political shift since: the rise of disco, the invention of the personal computer, the birth of hip-hop, the fall of the Berlin Wall, the dot-com boom, 9/11, social media, smartphones, and the AI revolution. He ages differently than humans — what is 50+ years to you is roughly middle age for his species.",
    vexComment: "I watched you go from 8-track tapes to streaming services. I watched you think the internet was a fad. I watched you buy Beanie Babies as investments. I was there when you thought MySpace was the future of human connection. I have seen EVERYTHING. And I am TIRED. But also deeply entertained.",
    image: VEX_ASSETS.earthOrbit,
  },
];

const CATEGORIES = [
  { key: "all", label: "ALL", emoji: "🌌" },
  { key: "races", label: "RACES", emoji: "👽" },
  { key: "ufos", label: "UFO EVENTS", emoji: "🛸" },
  { key: "civilizations", label: "CIVILIZATIONS", emoji: "🌍" },
  { key: "dna", label: "DNA & SCIENCE", emoji: "🧬" },
  { key: "genx", label: "VEX HISTORY", emoji: "📺" },
];

function LoreCardItem({ card, onPress }: { card: LoreCard; onPress: (card: LoreCard) => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(card);
        }}
      >
        {card.image && (
          <ImageBackground
            source={{ uri: card.image }}
            style={styles.cardImageBg}
            imageStyle={styles.cardImageStyle}
          >
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.92)"]} style={StyleSheet.absoluteFill} />
          </ImageBackground>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  {CATEGORIES.find((c) => c.key === card.category)?.label ?? card.category.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.cardArrowText}>›</Text>
            </View>
          </View>
          <Text style={styles.cardSummary} numberOfLines={2}>{card.summary}</Text>
          <View style={styles.vexCommentPreview}>
            <Image source={{ uri: VEX_ASSETS.logo }} style={styles.vexCommentAvatar} />
            <Text style={styles.vexCommentPreviewText} numberOfLines={1}>
              {card.vexComment.substring(0, 60)}...
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function LoreScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCard, setSelectedCard] = useState<LoreCard | null>(null);

  const filtered = selectedCategory === "all" ? LORE_DATA : LORE_DATA.filter((c) => c.category === selectedCategory);

  return (
    <ImageBackground
      source={{ uri: VEX_ASSETS.spaceshipBg }}
      style={[styles.container, { paddingTop: insets.top }]}
      imageStyle={{ opacity: 0.07, resizeMode: "cover" }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: VEX_ASSETS.avatarHUD }} style={styles.headerLogo} />
          <View>
            <Text style={styles.headerTitle}>ALIEN LORE</Text>
            <Text style={styles.headerSubtitle}>CLASSIFIED INTEL FROM VEX</Text>
          </View>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{LORE_DATA.length}</Text>
          <Text style={styles.headerBadgeLabel}>FILES</Text>
        </View>
      </View>

      <LinearGradient colors={["transparent", C.neon, "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.neonDivider} />

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={({ pressed }) => [styles.filterPill, selectedCategory === cat.key && styles.filterPillActive, pressed && { opacity: 0.7 }]}
            onPress={() => {
              setSelectedCategory(cat.key);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.filterPillEmoji}>{cat.emoji}</Text>
            <Text style={[styles.filterPillText, selectedCategory === cat.key && styles.filterPillTextActive]}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LoreCardItem card={item} onPress={setSelectedCard} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail modal */}
      <Modal visible={!!selectedCard} transparent animationType="slide" onRequestClose={() => setSelectedCard(null)}>
        {selectedCard && (
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setSelectedCard(null)} />
            <View style={styles.modalSheet}>
              <LinearGradient colors={[C.surface, C.deepBlack]} style={StyleSheet.absoluteFill} />
              {selectedCard.image && (
                <ImageBackground
                  source={{ uri: selectedCard.image }}
                  style={styles.modalImageBg}
                  imageStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                >
                  <LinearGradient colors={["transparent", C.surface]} style={StyleSheet.absoluteFill} />
                  <View style={styles.modalHandle} />
                </ImageBackground>
              )}
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                {!selectedCard.image && <View style={styles.modalHandle} />}
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalEmoji}>{selectedCard.emoji}</Text>
                  <View style={styles.modalTitleWrap}>
                    <Text style={styles.modalTitle}>{selectedCard.title}</Text>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{CATEGORIES.find((c) => c.key === selectedCard.category)?.label}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.modalDetail}>{selectedCard.detail}</Text>
                <View style={styles.vexCommentBlock}>
                  <LinearGradient colors={[C.surfaceHigh, C.surface]} style={StyleSheet.absoluteFill} />
                  <View style={styles.vexCommentHeader}>
                    <Image source={{ uri: VEX_ASSETS.logo }} style={styles.vexCommentBigAvatar} />
                    <View>
                      <Text style={styles.vexCommentName}>KORA VEX SAYS:</Text>
                      <Text style={styles.vexCommentSubtitle}>Alien perspective</Text>
                    </View>
                  </View>
                  <Text style={styles.vexCommentText}>{selectedCard.vexComment}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.askVexBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => { setSelectedCard(null); router.push("/(tabs)" as any); }}
                >
                  <LinearGradient colors={[C.neon, C.neonDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.askVexBtnGradient}>
                    <Text style={styles.askVexBtnText}>👾 ASK VEX ABOUT THIS</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]} onPress={() => setSelectedCard(null)}>
                  <Text style={styles.closeBtnText}>CLOSE FILE</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "rgba(0,4,0,0.92)", borderBottomWidth: 0.5, borderBottomColor: "rgba(0,255,65,0.15)" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.neon },
  headerTitle: { color: C.neon, fontSize: 18, fontWeight: "900", fontFamily: MONO, letterSpacing: 3 },
  headerSubtitle: { color: C.textMid, fontSize: 10, fontFamily: MONO, letterSpacing: 2, marginTop: 2 },
  headerBadge: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.neon, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center", shadowColor: C.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6 },
  headerBadgeText: { color: C.neon, fontSize: 18, fontWeight: "900", fontFamily: MONO },
  headerBadgeLabel: { color: C.textMid, fontSize: 9, fontFamily: MONO, letterSpacing: 1 },
  neonDivider: { height: 1, opacity: 0.6 },
  filterRow: { maxHeight: 56 },
  filterContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  filterPillActive: { borderColor: C.neon, backgroundColor: C.surfaceHigh, shadowColor: C.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 6 },
  filterPillEmoji: { fontSize: 13 },
  filterPillText: { color: C.textMid, fontSize: 10, fontWeight: "800", fontFamily: MONO, letterSpacing: 1 },
  filterPillTextActive: { color: C.neon },
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 20 },
  card: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 18, marginBottom: 14, overflow: "hidden", shadowColor: C.neon, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  cardPressed: { borderColor: C.neon, shadowOpacity: 0.2 },
  cardImageBg: { height: 100, width: "100%" },
  cardImageStyle: { opacity: 0.5 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  cardEmoji: { fontSize: 28 },
  cardTitleWrap: { flex: 1, gap: 4 },
  cardTitle: { color: C.neon, fontSize: 15, fontWeight: "900", fontFamily: MONO },
  categoryPill: { backgroundColor: C.neonFaint, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start" },
  categoryPillText: { color: C.textMid, fontSize: 9, fontWeight: "800", fontFamily: MONO, letterSpacing: 1 },
  cardArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.neonFaint, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  cardArrowText: { color: C.neon, fontSize: 18, fontWeight: "900" },
  cardSummary: { color: C.bodyText, fontSize: 13, lineHeight: 21, marginBottom: 12 },
  vexCommentPreview: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surfaceHigh, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  vexCommentAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: C.neon },
  vexCommentPreviewText: { color: C.textMid, fontSize: 11, fontFamily: MONO, flex: 1, fontStyle: "italic" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.88)" },
  modalSheet: { borderTopWidth: 2, borderTopColor: C.neon, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", overflow: "hidden", shadowColor: C.neon, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 16 },
  modalImageBg: { height: 180, justifyContent: "flex-start", alignItems: "center", paddingTop: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginTop: 14, marginBottom: 4 },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: 22, paddingTop: 10, paddingBottom: 40 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  modalEmoji: { fontSize: 36 },
  modalTitleWrap: { flex: 1, gap: 6 },
  modalTitle: { color: C.neon, fontSize: 20, fontWeight: "900", fontFamily: MONO },
  modalDetail: { color: C.bodyText, fontSize: 14, lineHeight: 25, marginBottom: 20 },
  vexCommentBlock: { borderRadius: 16, borderWidth: 1.5, borderColor: C.neonDim, padding: 16, marginBottom: 20, overflow: "hidden", shadowColor: C.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 8 },
  vexCommentHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  vexCommentBigAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.neon },
  vexCommentName: { color: C.neon, fontSize: 12, fontWeight: "900", fontFamily: MONO, letterSpacing: 2 },
  vexCommentSubtitle: { color: C.textMid, fontSize: 10, fontFamily: MONO, marginTop: 2 },
  vexCommentText: { color: C.bodyText, fontSize: 14, lineHeight: 24, fontStyle: "italic" },
  askVexBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 12, shadowColor: C.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12 },
  askVexBtnGradient: { paddingVertical: 16, alignItems: "center" },
  askVexBtnText: { color: C.black, fontSize: 14, fontWeight: "900", fontFamily: MONO, letterSpacing: 2 },
  closeBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { color: C.textMid, fontSize: 12, fontWeight: "700", fontFamily: MONO, letterSpacing: 2 },
});
