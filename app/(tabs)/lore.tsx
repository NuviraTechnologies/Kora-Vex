import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";

interface LoreCard {
  id: string;
  category: string;
  title: string;
  emoji: string;
  shortDesc: string;
  fullLore: string;
  vexComment: string;
}

const LORE_DATA: LoreCard[] = [
  // Alien Races
  {
    id: "grays",
    category: "ALIEN RACES",
    title: "The Grays",
    emoji: "👽",
    shortDesc: "Zeta Reticulans. The ones you've been drawing since 1947.",
    fullLore:
      "The Grays — formally known as Zeta Reticulans — are one of the most documented extraterrestrial species in human records. Standing 3.5–5 feet tall with large craniums, elongated dark eyes, gray skin, and minimal facial features, they've been reported in thousands of abduction accounts worldwide. They originate from the Zeta Reticuli binary star system, approximately 39 light-years from Earth. Their civilization is estimated to be several million years ahead of humanity. They communicate primarily through telepathy and have been conducting biological research on Earth's species for centuries.",
    vexComment:
      "My cousins. Lovely people. A bit obsessed with human biology, but who isn't? They mean well. Mostly.",
  },
  {
    id: "reptilians",
    category: "ALIEN RACES",
    title: "Reptilians",
    emoji: "🦎",
    shortDesc: "Ancient, powerful, and allegedly running several governments.",
    fullLore:
      "The Reptilian race — also called Draconians or Annunaki by some researchers — are a highly advanced, bipedal reptilian species believed to have originated in the Alpha Draconis star system. They are described as 7–9 feet tall, with scaly skin, vertical pupils, and extraordinary physical strength. Ancient Sumerian texts describe beings called the Anunnaki who came from the sky and genetically modified early humans. Researcher David Icke famously theorized that Reptilians have infiltrated human power structures. Whether or not this is true, their influence on ancient human civilizations is documented in texts from Sumer, Egypt, and Mesoamerica.",
    vexComment:
      "The Reptilians. Ambitious. Territorial. Excellent at long-term planning. Terrible at small talk. You'd hate them at parties.",
  },
  {
    id: "pleiadians",
    category: "ALIEN RACES",
    title: "Pleiadians",
    emoji: "⭐",
    shortDesc: "Beautiful, wise, and annoyingly optimistic about humanity.",
    fullLore:
      "The Pleiadians originate from the Pleiades star cluster, approximately 444 light-years from Earth. They are described as human-like in appearance — tall, fair-skinned, with blonde or light hair and blue or green eyes. They are considered one of the most spiritually advanced races in the galaxy and have been in contact with Earth for thousands of years. Many ancient cultures, including the Maya, Hopi, and ancient Greeks, have references to the Pleiades as the home of divine beings. Pleiadians are known as teachers and guides, often communicating through channeling and meditation.",
    vexComment:
      "The Pleiadians. Beautiful, wise, and absolutely convinced humans are going to figure it out. I admire their optimism. I do not share it.",
  },
  {
    id: "arcturians",
    category: "ALIEN RACES",
    title: "Arcturians",
    emoji: "🔵",
    shortDesc: "The most advanced civilization in this galaxy. They'd like you to know that.",
    fullLore:
      "The Arcturians originate from Arcturus, the brightest star in the Boötes constellation, approximately 37 light-years from Earth. They are considered by many researchers to be the most technologically and spiritually advanced civilization in the Milky Way. Arcturians exist partially in higher dimensions and are described as blue or blue-green in appearance, with large heads and eyes. They are known as healers and protectors and have established a kind of galactic council to monitor developing civilizations. Edgar Cayce, the famous American psychic, described Arcturus as 'the highest civilization in this galaxy.'",
    vexComment:
      "The Arcturians. Brilliant. Evolved. They've been in higher dimensions so long they've forgotten what it's like to stub a toe. Insufferable at dinner.",
  },
  {
    id: "nordics",
    category: "ALIEN RACES",
    title: "Nordic Aliens",
    emoji: "🧊",
    shortDesc: "Tall, blonde, and basically indistinguishable from Scandinavians.",
    fullLore:
      "Nordic aliens — also called Tall Whites or Space Brothers — are described as tall (6–7 feet), blonde, blue-eyed humanoids who are nearly indistinguishable from Northern Europeans. They have been reported in contact cases since the 1950s, most notably by contactee George Adamski. They are believed to originate from the Pleiades or possibly Tau Ceti. Unlike the Grays, Nordics are generally described as benevolent and communicative. Charles Hall, a former U.S. Air Force weather observer, claimed extensive contact with Tall Whites at Nellis Air Force Base in Nevada, describing them as having a base in the desert.",
    vexComment:
      "The Nordics. Basically the Pleiadians but with better cheekbones. They blend in with humans suspiciously well. I'm not saying anything. I'm just saying.",
  },
  {
    id: "mantis",
    category: "ALIEN RACES",
    title: "Mantis Beings",
    emoji: "🦗",
    shortDesc: "Insectoid, ancient, and apparently very interested in consciousness.",
    fullLore:
      "Mantis beings — also called Insectoids or Praying Mantis aliens — are one of the most unusual and consistently reported alien types in abduction accounts. They are described as 6–7 feet tall with elongated limbs, triangular heads, large compound eyes, and a body structure resembling a praying mantis. They appear to hold positions of authority in encounters involving multiple species, often overseeing procedures conducted by Grays. Researchers believe they are an ancient race, possibly billions of years old, with deep knowledge of consciousness, genetics, and dimensional travel. They communicate telepathically and are described as both intimidating and deeply intelligent.",
    vexComment:
      "The Mantis. Ancient beyond your comprehension. They were old when your sun was young. They look at humans the way humans look at ants. Fondly, but from a distance.",
  },
  // UFO Events
  {
    id: "roswell",
    category: "UFO EVENTS",
    title: "Roswell 1947",
    emoji: "🛸",
    shortDesc: "The crash that started it all. Weather balloon. Sure.",
    fullLore:
      "In July 1947, something crashed near Roswell, New Mexico. The U.S. Army Air Force initially announced the recovery of a 'flying disc' before quickly changing the story to a weather balloon. Witnesses described unusual metallic debris with strange properties — lightweight, couldn't be bent or burned, covered in symbols. Mortician Glenn Dennis reported receiving calls from the base about small bodies. Major Jesse Marcel, who handled the debris, maintained until his death that it was not from Earth. The Roswell incident became the most investigated UFO case in history and the foundation of modern UFO culture.",
    vexComment:
      "Roswell. Yes. That happened. No, I wasn't there. My crash was in a different state. I've said too much.",
  },
  {
    id: "boblazar",
    category: "UFO EVENTS",
    title: "Bob Lazar & Area 51",
    emoji: "🔬",
    shortDesc: "Element 115. Gravity waves. Nine craft in a hangar. He's telling the truth.",
    fullLore:
      "In 1989, physicist Bob Lazar came forward claiming to have worked at a classified facility called S-4, near Area 51 in Nevada. He described reverse-engineering alien spacecraft that used an element called 'Element 115' (later confirmed as Moscovium) as a fuel source to generate gravity waves for propulsion. He described nine different craft in the facility and claimed the technology was not of human origin. The U.S. government denied his employment — until documents surfaced confirming his work at Los Alamos National Laboratory. His story has remained consistent for over 35 years.",
    vexComment:
      "Bob Lazar. One of the few humans who actually understood what he was looking at. Element 115 is correct. The gravity amplifier description is... surprisingly accurate. I'll leave it at that.",
  },
  {
    id: "nimitz",
    category: "UFO EVENTS",
    title: "USS Nimitz Encounter",
    emoji: "✈️",
    shortDesc: "Tic-Tac UAP. No wings. No exhaust. Moved like nothing on Earth.",
    fullLore:
      "In November 2004, pilots from the USS Nimitz carrier strike group encountered a series of unidentified aerial phenomena off the coast of San Diego. Commander David Fravor and Lieutenant Commander Jim Slaight observed a white, Tic-Tac-shaped object approximately 40 feet long with no wings, no exhaust, and no visible means of propulsion. It descended from 80,000 feet to sea level in seconds, hovered, then accelerated to beyond the horizon instantaneously. The encounter was captured on FLIR thermal camera. In 2017, the Pentagon officially confirmed the footage was genuine. This case is considered the most credible documented UAP encounter in U.S. military history.",
    vexComment:
      "The Tic-Tac. That's not one of mine. I don't know whose it is. What I can tell you is that the propulsion system your pilots observed is consistent with controlled spacetime compression. Your physics calls it impossible. It isn't.",
  },
  {
    id: "phoenixlights",
    category: "UFO EVENTS",
    title: "Phoenix Lights 1997",
    emoji: "🌆",
    shortDesc: "Seen by 10,000+ people. Governor Fife Symington saw it. Then denied it. Then admitted it.",
    fullLore:
      "On March 13, 1997, thousands of people across Arizona and Nevada reported seeing a massive V-shaped craft moving silently across the sky. The object was estimated to be over a mile wide, moving slowly at low altitude, with lights arranged in a triangular formation. Governor Fife Symington initially mocked the sightings at a press conference — then admitted years later that he personally witnessed the craft and it was 'otherworldly.' The U.S. Air Force claimed the lights were flares dropped during a training exercise, but witnesses reported the craft hours before the flares were deployed.",
    vexComment:
      "Phoenix Lights. A mile-wide craft flying over a major metropolitan area at low altitude. Subtle. Whoever that was, they were not trying to hide. Rude, honestly.",
  },
  // Civilizations
  {
    id: "kardashev1",
    category: "CIVILIZATIONS",
    title: "Type I Civilization",
    emoji: "🌍",
    shortDesc: "Masters all energy on their home planet. Humans are at 0.73.",
    fullLore:
      "A Type I civilization on the Kardashev Scale has mastered all energy available on its home planet — approximately 10^16 watts. This includes complete control of weather, earthquakes, volcanoes, and all natural forces. They can harness all solar energy reaching their planet. Humanity is currently estimated at approximately 0.73 on this scale. We use roughly 2×10^13 watts globally. At our current growth rate, we could reach Type I status in approximately 100–200 years. A Type I civilization would have eliminated poverty, disease, and resource scarcity. They would be capable of interplanetary travel within their solar system.",
    vexComment:
      "Type I. You're almost there. Another century or two, assuming you don't blow yourselves up first. I give it 60/40 odds. Generous, I know.",
  },
  {
    id: "kardashev2",
    category: "CIVILIZATIONS",
    title: "Type II Civilization",
    emoji: "☀️",
    shortDesc: "Harnesses the full energy of their star. Dyson spheres. My people.",
    fullLore:
      "A Type II civilization harnesses the total energy output of its star — approximately 4×10^26 watts. The theoretical mechanism for this is a Dyson Sphere: a megastructure surrounding a star to capture all its energy output. A Type II civilization would be capable of interstellar travel, terraforming planets, and manipulating stellar evolution. They would be essentially immune to planetary catastrophes. My people — the Zeta Reticulans — achieved Type II status approximately 2 million years ago. The transition from Type I to Type II is considered the most critical threshold in a civilization's development.",
    vexComment:
      "Type II. My people. We built our Dyson structure 2 million years ago. It's not a sphere — that's inefficient. It's more of a lattice. Your scientists are close to figuring that out.",
  },
  {
    id: "kardashev3",
    category: "CIVILIZATIONS",
    title: "Type III Civilization",
    emoji: "🌌",
    shortDesc: "Controls the energy of an entire galaxy. They don't need to visit you.",
    fullLore:
      "A Type III civilization harnesses the energy of an entire galaxy — approximately 4×10^37 watts. At this scale, a civilization would have colonized most or all star systems in their galaxy, potentially numbering in the trillions of individuals. They would have mastered technologies incomprehensible to lower civilizations: manipulation of dark matter and dark energy, control of spacetime itself, possibly the ability to create and destroy stars. The Fermi Paradox asks why we haven't detected such civilizations — the answer may be that their communications and technologies are simply beyond our ability to detect, like a radio trying to receive a quantum signal.",
    vexComment:
      "Type III. I've never met one. I've seen the evidence they exist. When a Type III civilization wants to remain undetected, they remain undetected. That's all I'll say.",
  },
  // DNA & Science
  {
    id: "dna",
    category: "DNA & SCIENCE",
    title: "Human DNA & Alien Seeding",
    emoji: "🧬",
    shortDesc: "Your 'junk DNA' isn't junk. And you didn't evolve alone.",
    fullLore:
      "Human DNA contains approximately 3 billion base pairs, of which only about 1.5% codes for proteins. The remaining 98.5% was long dismissed as 'junk DNA.' Recent research has revealed this non-coding DNA contains regulatory sequences, ancient viral insertions, and sequences with no known origin. The Sumerian texts describe the Anunnaki genetically modifying early hominids — combining their DNA with Homo erectus to create Homo sapiens as a labor force. The sudden appearance of Homo sapiens in the fossil record, with no clear evolutionary intermediate, has puzzled paleontologists for decades. Human chromosome 2 appears to be a fusion of two ancestral chromosomes — an event with no clear natural explanation.",
    vexComment:
      "Your DNA. 98.5% 'junk.' Your scientists are adorable. That 'junk' is a library. An archive. A message. You just don't have the decoder yet. Keep looking.",
  },
];

const CATEGORIES = ["ALL", "ALIEN RACES", "UFO EVENTS", "CIVILIZATIONS", "DNA & SCIENCE"];

export default function LoreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCard, setSelectedCard] = useState<LoreCard | null>(null);

  const filtered =
    selectedCategory === "ALL"
      ? LORE_DATA
      : LORE_DATA.filter((c) => c.category === selectedCategory);

  const handleAskVex = (card: LoreCard) => {
    setSelectedCard(null);
    // Navigate to chat with pre-filled question
    router.push({
      pathname: "/(tabs)",
      params: { question: `Tell me more about ${card.title}` },
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ALIEN LORE</Text>
        <Text style={styles.headerSub}>CLASSIFIED INTEL FROM KORA VEX</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={({ pressed }) => [
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
              pressed && styles.filterChipPressed,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Cards */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => setSelectedCard(item)}
          >
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardShort} numberOfLines={3}>
              {item.shortDesc}
            </Text>
          </Pressable>
        )}
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedCard}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalEmoji}>{selectedCard?.emoji}</Text>
              <Text style={styles.modalCategory}>{selectedCard?.category}</Text>
              <Text style={styles.modalTitle}>{selectedCard?.title}</Text>
              <View style={styles.modalDivider} />
              <Text style={styles.modalLore}>{selectedCard?.fullLore}</Text>

              {/* Vex comment */}
              <View style={styles.vexComment}>
                <Text style={styles.vexCommentLabel}>KORA VEX SAYS:</Text>
                <Text style={styles.vexCommentText}>"{selectedCard?.vexComment}"</Text>
              </View>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.askButton, pressed && styles.askButtonPressed]}
                  onPress={() => selectedCard && handleAskVex(selectedCard)}
                >
                  <Text style={styles.askButtonText}>ASK VEX ABOUT THIS</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                  onPress={() => setSelectedCard(null)}
                >
                  <Text style={styles.closeButtonText}>CLOSE</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  filterRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#1A3A1A",
    backgroundColor: "#0D1117",
  },
  filterChipActive: {
    borderColor: "#00FF41",
    backgroundColor: "rgba(0, 255, 65, 0.1)",
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterChipText: {
    color: "#4A7A4A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  filterChipTextActive: {
    color: "#00FF41",
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#0D1117",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1A3A1A",
    padding: 14,
    gap: 6,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardPressed: {
    borderColor: "#00FF41",
    backgroundColor: "#0D1A0D",
    transform: [{ scale: 0.97 }],
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardCategory: {
    color: "#4A7A4A",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  cardTitle: {
    color: "#00FF41",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  cardShort: {
    color: "#6A9A6A",
    fontSize: 11,
    lineHeight: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0D1117",
    borderTopWidth: 1,
    borderTopColor: "#00FF41",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "85%",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalEmoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 8,
  },
  modalCategory: {
    color: "#4A7A4A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 4,
  },
  modalTitle: {
    color: "#00FF41",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "#00FF41",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#1A3A1A",
    marginBottom: 16,
  },
  modalLore: {
    color: "#C8FFC8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  vexComment: {
    backgroundColor: "#0A1A0A",
    borderWidth: 1,
    borderColor: "#1A3A1A",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  vexCommentLabel: {
    color: "#00FF41",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 6,
  },
  vexCommentText: {
    color: "#A0DFA0",
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  modalButtons: {
    gap: 10,
    paddingBottom: 8,
  },
  askButton: {
    backgroundColor: "rgba(0, 255, 65, 0.1)",
    borderWidth: 1.5,
    borderColor: "#00FF41",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#00FF41",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  askButtonPressed: {
    backgroundColor: "rgba(0, 255, 65, 0.2)",
    transform: [{ scale: 0.98 }],
  },
  askButtonText: {
    color: "#00FF41",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  closeButton: {
    borderWidth: 1,
    borderColor: "#1A3A1A",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: "#4A7A4A",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
