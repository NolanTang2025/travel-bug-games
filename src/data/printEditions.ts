import type { EditionGameType } from "@/games/types";

export type PerformanceTier = "gentle" | "steady" | "spark";

export type EditionGameSpec = {
  type: EditionGameType;
  title: string;
  tagline: string;
  background: string;
  duration: number;
  controls: string;
  genre: string;
};

export type PrintEdition = {
  id: string;
  n: string;
  title: string;
  tag: string;
  tone: string;
  city: string;
  dateStamp: string;
  teaser: string;
  blurb: string;
  mood: string;
  coverPhoto: string;
  coverArt: string;
  game: EditionGameSpec;
  /** Score thresholds for journal tier (varies by game type) */
  scoreTargets: { steady: number; spark: number };
  journal: Record<PerformanceTier, string>;
};

export const PRINT_EDITIONS: PrintEdition[] = [
  {
    id: "kyoto-fireflies",
    n: "01",
    title: "Fireflies of Kyoto",
    tag: "RPG · night",
    tone: "bg-gradient-bubblegum",
    city: "Arashiyama · Kyoto",
    dateStamp: "July 14, 2019 · 9:47 PM",
    teaser: "Riverbank humidity, bare feet, lights that refuse to stay caught.",
    blurb:
      "A micro-RPG along the Kamo: talk to strangers, make choices, then fill your jar before the rain.",
    mood: "quiet · humid · nostalgic",
    coverPhoto: "/editions/kyoto-fireflies.jpg",
    coverArt: "/editions/kyoto-fireflies-riso.png",
    game: {
      type: "rpg",
      title: "Fireflies of Kyoto",
      tagline: "Choose your path. Catch the glow. Fill the jar.",
      background:
        "linear-gradient(180deg, oklch(0.35 0.12 280), oklch(0.22 0.08 260), oklch(0.15 0.04 250))",
      duration: 45,
      controls: "Click choices · tap fireflies · avoid rain",
      genre: "Story RPG + jar catcher",
    },
    scoreTargets: { steady: 70, spark: 120 },
    journal: {
      gentle:
        "Didn't catch many tonight — score says {score}, and I'm not arguing. Sat on the bank instead, socks in my bag, toes in the grass. The fireflies didn't perform for me. They just existed. A couple floated up from the reeds and I thought about how some things are only beautiful because you can't keep them. Missed {misses}. Kept zero in a jar. Wouldn't have it another way.",
      steady:
        "Caught {score} before the drizzle won. There was a kid next to me who gasped every time one landed on her sleeve — I stopped counting my own after that. Grandpa used to say fireflies were old poems looking for someone to read them. Tonight I think he was half right. {misses} slipped away. I let them.",
      spark:
        "{score}. Thumb sore, heart full. Ran along the river path chasing lights like I was seventeen again. An old man on a bench laughed and said 'youth.' I pretended not to hear him but I was grinning. Only {misses} escaped. Grandpa would've said those were the ones that became stars.",
    },
  },
  {
    id: "tokyo-crosswalk",
    n: "02",
    title: "Tokyo Crosswalk",
    tag: "dodge · lanes",
    tone: "bg-gradient-ultraviolet",
    city: "Shibuya · Tokyo",
    dateStamp: "March 3, 2024 · 6:12 PM",
    teaser: "Green light. A thousand strangers. You learn to move without being seen.",
    blurb:
      "Frogger-style scramble: switch lanes, dodge traffic, cross Shibuya again and again before the light turns.",
    mood: "neon · anonymous · electric",
    coverPhoto: "/editions/tokyo-crosswalk.jpg",
    coverArt: "/editions/tokyo-crosswalk-riso.png",
    game: {
      type: "frogger",
      title: "Tokyo Crosswalk",
      tagline: "Five lanes. Endless cars. Get to the other side.",
      background:
        "linear-gradient(180deg, oklch(0.55 0.22 320), oklch(0.35 0.18 280), oklch(0.18 0.06 260))",
      duration: 30,
      controls: "↑↓ switch lanes · auto-walk east",
      genre: "Lane dodge / Frogger",
    },
    scoreTargets: { steady: 80, spark: 200 },
    journal: {
      gentle:
        "Stood frozen through most of it. Score: {score}. Misses: {misses}. Everyone flowed around me like I was a stone in a stream — and honestly, some nights that's what Tokyo asks of you. Bought a hot can of coffee from the vending machine after. Watched three salarymen laugh at something on a phone. Wanted to know the joke. Didn't ask.",
      steady:
        "Blocked {score} cars in my head. In real life I waited two light cycles and crossed with a grandmother who grabbed my wrist without looking. She let go on the other side like we'd always known each other. {misses} near-misses. The city felt less loud for about four seconds.",
      spark:
        "Perfect rhythm — {score} blocks, only {misses} slip. For one green light I was the only person who knew the timing. Headphones in, world out. A girl in a yellow coat matched my pace for half the crossing then peeled off into Hachiko exit. I never saw her again. That's the whole city in one moment.",
    },
  },
  {
    id: "lisbon-tram",
    n: "03",
    title: "Lisbon Tram",
    tag: "collect · ride",
    tone: "bg-gradient-sunrise",
    city: "Alfama · Lisbon",
    dateStamp: "October 21, 2023 · 4:30 PM",
    teaser: "Yellow car, blue tile, hills that punish your calves and reward your eyes.",
    blurb:
      "Drive Tram 28 along the rails — steer left and right, scoop tickets, dodge pigeons on the downhill.",
    mood: "golden · tiled · bittersweet",
    coverPhoto: "/editions/lisbon-tram.jpg",
    coverArt: "/editions/lisbon-tram-riso.png",
    game: {
      type: "collector",
      title: "Lisbon Tram",
      tagline: "Ride the rails. Grab tickets. Mind the birds.",
      background:
        "linear-gradient(180deg, oklch(0.82 0.14 85), oklch(0.68 0.12 55), oklch(0.45 0.08 240))",
      duration: 30,
      controls: "← → or drag · catch falling tickets",
      genre: "Coin / ticket collector",
    },
    scoreTargets: { steady: 100, spark: 220 },
    journal: {
      gentle:
        "Collected {score} tickets. Missed {misses}. Gave up and got a pastel de nata instead — still warm, cinnamon on my fingers. The tram screamed past on the rails and I didn't chase it. Some rides you watch from the bakery window. Fado leaked out of a doorway. I understood zero words and every one of them.",
      steady:
        "{score} fares. The driver rang the bell twice like it meant something personal. My legs were jelly from the hills but the azulejos at Miradouro made me stay standing. A pigeon got {misses} of my crumbs. Fair trade. Wrote this on a napkin; ink smudged. Keeping it anyway.",
      spark:
        "Ran alongside the tram for half a block — {score} tickets, {misses} birds, zero dignity. A woman inside pressed her palm to the glass. I waved like we'd shared a whole youth. The car turned the corner and the street smelled like grilled sardines and salt. I scored high and still felt like the one who lost something.",
    },
  },
  {
    id: "hanoi-motorbike",
    n: "04",
    title: "Hanoi Motorbike",
    tag: "weave · arena",
    tone: "bg-gradient-peach",
    city: "Old Quarter · Hanoi",
    dateStamp: "January 8, 2025 · 7:55 AM",
    teaser: "Cross the street with faith. The soup vendor is watching.",
    blurb:
      "Top-down Old Quarter chaos: move freely, grab phở bowls, weave through bikes from every direction.",
    mood: "chaotic · warm · trusting",
    coverPhoto: "/editions/hanoi-motorbike.jpg",
    coverArt: "/editions/hanoi-motorbike-riso.png",
    game: {
      type: "arena",
      title: "Hanoi Motorbike",
      tagline: "Free movement. Swarm traffic. Guard your bowl.",
      background:
        "linear-gradient(180deg, oklch(0.78 0.12 65), oklch(0.62 0.14 45), oklch(0.38 0.06 30))",
      duration: 30,
      controls: "WASD / arrows · collect 🍜 · avoid 🏍️",
      genre: "Top-down arena weave",
    },
    scoreTargets: { steady: 80, spark: 180 },
    journal: {
      gentle:
        "Couldn't weave worth a damn. Score {score}, misses {misses}. A stranger linked my elbow and said 'just walk' — we crossed together in one slow confident line while bikes flowed around us like water around a rock. The phở lady added extra herbs without me asking. Maybe pity. Maybe she saw the whole thing.",
      steady:
        "Dodged {score} in the game; dodged about the same in real life yesterday. Heart rate: unreasonable. A kid on a Honda gave me a thumbs up at the light like I'd passed a test. {misses} close calls. Slurped noodles on a plastic stool. Best morning in months.",
      spark:
        "{score} clean weaves. Only {misses} wobble. Crossed Hoàn Kiếm like I'd lived here ten years — then immediately almost walked into a delivery bike and laughed so hard the vendor asked if I was okay. I was. I am. Hanoi makes you feel alive in a way that's almost rude about it.",
    },
  },
];

export function getEditionById(id: string): PrintEdition | undefined {
  return PRINT_EDITIONS.find((e) => e.id === id);
}

export function getPerformanceTier(
  score: number,
  misses: number,
  edition: PrintEdition,
): PerformanceTier {
  const { steady, spark } = edition.scoreTargets;
  if (score >= spark && misses <= 5) return "spark";
  if (score >= steady || misses <= 8) return "steady";
  return "gentle";
}

export function buildJournalEntry(
  edition: PrintEdition,
  score: number,
  misses: number,
): string {
  const tier = getPerformanceTier(score, misses, edition);
  return edition.journal[tier]
    .replace(/\{score\}/g, String(score))
    .replace(/\{misses\}/g, String(misses));
}

export const TIER_LABELS: Record<PerformanceTier, string> = {
  gentle: "A quiet entry",
  steady: "Written on the ride home",
  spark: "Ink still wet",
};
