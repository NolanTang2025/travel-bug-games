import type { TextRound } from "./types";

export const GENERIC_QUIZ: TextRound[] = [
  {
    prompt: "be honest — your trip was mostly giving…",
    options: ["main character delulu", "social battery at 0%", "accidentally feral", "quietly thriving"],
    correctIndex: 0,
  },
  {
    prompt: "if you could steal ONE thing home (legally-ish), it's…",
    options: ["a photo that slaps", "a smell stuck in your hoodie", "a phrase you can't explain", "the route you got lost on"],
    correctIndex: 0,
  },
  {
    prompt: "locals would clock you as the person who…",
    options: ["speed-runs the highlights", "only shoots for the feed", "vanishes into side streets", "buys magnets and dips"],
    correctIndex: 2,
  },
  {
    prompt: "tomorrow you wake up here again — you're…",
    options: ["same spot, deeper lore", "new block, new chaos", "train to somewhere random", "bed rot (respectfully)"],
    correctIndex: 1,
  },
];

export const GENERIC_FILL: TextRound[] = [
  { prompt: "today's air smells like ___", options: ["rain on hot pavement", "salt + regret", "overpriced coffee", "pine + peace"], correctIndex: 0 },
  { prompt: "one word rent-free in your head: ___", options: ["slow", "feral", "far", "unwell"], correctIndex: 0 },
  { prompt: "text to the group chat: finally ___", options: ["made it", "ate", "survived", "slept"], correctIndex: 0 },
  { prompt: "before you leave, one more ___", options: ["walk", "pic", "bite", "sit and stare"], correctIndex: 0 },
];

export const GENERIC_ORDER: TextRound[] = [
  { prompt: "drag the words into your actual vibe", tiles: ["not me", "finally", "slowing", "down"] },
  { prompt: "build the core memory (unhinged edition)", tiles: ["walked past", "a spot", "that smelled", "illegal"] },
  { prompt: "your goodbye caption starts with…", tiles: ["need", "to come", "back", "here"] },
];

export const GENERIC_CHOICE: TextRound[] = [
  { prompt: "fork in the road — you pick…", options: ["follow the crowd (coward)", "side quest alley"], correctIndex: 1 },
  { prompt: "you're starving — first move?", options: ["queue for hype (why)", "random hole-in-the-wall"], correctIndex: 1 },
  { prompt: "sun's dipping — you…", options: ["sprint to the hotel", "10 more min of sky"], correctIndex: 1 },
  { prompt: "language barrier hits — you…", options: ["charades era", "leave (rude)"], correctIndex: 0 },
];
