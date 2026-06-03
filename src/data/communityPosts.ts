import type { PerformanceTier } from "./printEditions";

export type CommunityPhoto = {
  src: string;
  label: string;
  credit: string;
};

export type CommunityTravelPost = {
  editionId: string;
  author: {
    name: string;
    handle: string;
    from: string;
    avatarInitials: string;
  };
  postedAt: string;
  visited: string;
  photos: CommunityPhoto[];
  body: string;
  tags: string[];
  /** Shown after the user plays — ties game score to their trip note */
  gameFootnote: Record<PerformanceTier, string>;
};

export const COMMUNITY_POSTS: CommunityTravelPost[] = [
  {
    editionId: "kyoto-fireflies",
    author: {
      name: "Yuki Mori",
      handle: "@yuki_trails",
      from: "Osaka · posted from Kyoto",
      avatarInitials: "YM",
    },
    postedAt: "Jul 15, 2019 · 11:02 PM",
    visited: "Kamo River near Demachiyanagi",
    photos: [
      {
        src: "/editions/journal/kyoto-river-people.jpg",
        label: "yuka platforms along Kamo — firefly spot was too dark for pics",
        credit: "Flickr · CC BY",
      },
      {
        src: "/editions/journal/kyoto-kamo-river.jpg",
        label: "same river, daytime walk the week before",
        credit: "Wikimedia Commons",
      },
    ],
    body: `Stayed out way too late because the trains were still running. There were maybe 15 of us along the bank near Demachiyanagi — mostly couples and one guy sketching in the dark.

Fireflies are NOT like the photos. They're tiny green blinks in the grass, not fairy lights in a jar. A little girl next to us caught one in a cup and her dad made her release it after 30 seconds (good dad).

Tips if you go:
• Bug spray first. I forgot and regretted it.
• Bring a real camera if you have one — my iPhone 8 struggled.
• Weekday night was calm; friend said Saturday was packed.

Would go again. Just manage expectations — it's quiet magic, not a light show.`,
    tags: ["#kyoto", "#fireflies", "#hotaru", "#summerinjapan"],
    gameFootnote: {
      gentle:
        "Played the jar mini-game on Travel Bug just now — score {score}, missed {misses}. Felt like real life: I never catch them either 😅",
      steady:
        "Update after playing the edition here: {score} points, {misses} misses. About as good as my actual jar skills.",
      spark:
        "Ran the game after posting — {score} pts / {misses} misses. Finally caught more digitally than IRL lol",
    },
  },
  {
    editionId: "tokyo-crosswalk",
    author: {
      name: "Marcus Reid",
      handle: "@marcus.sees",
      from: "Sydney · first time in Japan",
      avatarInitials: "MR",
    },
    postedAt: "Mar 4, 2024 · 7:18 PM",
    visited: "Shibuya Scramble · Hachikō exit",
    photos: [
      {
        src: "/editions/journal/tokyo-shibuya-busy.jpg",
        label: "next morning — scramble from above (Mag's Park side)",
        credit: "Unsplash",
      },
      {
        src: "/editions/journal/tokyo-crossing-crop.jpg",
        label: "zoomed on the crossing, still couldn't do it at lunch",
        credit: "same trip",
      },
    ],
    body: `OK Shibuya crossing is exactly as chaotic as everyone says. Watched 4 cycles before I tried it.

What worked for me:
1. Pick a person going the same direction and stick near them.
2. Don't stop mid-crossing for photos (I learned that the hard way — horn, apology bow).
3. Night is easier than rush hour lunch — still busy but slower pace.

Hot can coffee from the machine after = peak experience. ¥130, tasted like victory.

If you're anxious: start at 8pm not 5pm. Fewer suits, more tourists who also look lost.`,
    tags: ["#shibuya", "#tokyo", "#solotravel", "#firsttime"],
    gameFootnote: {
      gentle:
        "Tried the crosswalk game on this site — froze up, score {score}, {misses} hits. Accurate simulation 😬",
      steady:
        "Played the Shibuya edition: {score} blocks, {misses} misses. Grandma wrist-grab energy not included but fair.",
      spark:
        "Game run: {score} / {misses}. Felt like I finally understood the timing. Still wouldn't do it at noon.",
    },
  },
  {
    editionId: "lisbon-tram",
    author: {
      name: "Ana Pereira",
      handle: "@ana.p.wanders",
      from: "Porto · weekend in Lisbon",
      avatarInitials: "AP",
    },
    postedAt: "Oct 22, 2023 · 5:41 PM",
    visited: "Tram 28 · Alfama → Graça",
    photos: [
      {
        src: "/editions/journal/lisbon-tram-street.jpg",
        label: "Tram 28 climbing Alfama",
        credit: "Hub JACQU / Pexels",
      },
      {
        src: "/editions/journal/lisbon-tram-close.jpg",
        label: "Bica funicular — waited 38 min for this",
        credit: "Hub JACQU / Pexels · crop",
      },
    ],
    body: `Tram 28 is beautiful and annoying — same energy.

Waited 38 min at Martim Moniz because three trams passed full. When we got on it was sardines + someone's pastel de nata smell (not complaining).

Real talk:
• Wear good shoes. Alfama hills destroyed my Vans.
• Keep your bag in front. Pickpockets are a thing; nothing happened to us but people warned us.
• Get off BEFORE the castle stop if you hate lines — we walked up and it was nicer.

Driver rang the bell like a personality trait. 10/10 audio experience.

Pastel de nata at Manteigaria — yes, worth the queue.`,
    tags: ["#lisbon", "#tram28", "#alfama", "#portugal"],
    gameFootnote: {
      gentle:
        "Played the tram collector game — {score} tickets, {misses} pigeons. Gave up and ate another pastel. No regrets.",
      steady:
        "Game score {score}, bird mishaps {misses}. Close enough to how I rode the actual tram (chaotic).",
      spark:
        "{score} fares in-game, only {misses} birds. Felt like the driver ringing the bell for me personally.",
    },
  },
  {
    editionId: "hanoi-motorbike",
    author: {
      name: "Linh Nguyen",
      handle: "@linh.ng87",
      from: "Ho Chi Minh City · home region trip",
      avatarInitials: "LN",
    },
    postedAt: "Jan 9, 2025 · 8:20 AM",
    visited: "Old Quarter · Hàng Buồm phở stall",
    photos: [
      {
        src: "/editions/journal/hanoi-traffic.jpg",
        label: "Hàng Buồm corner before phở — bikes everywhere",
        credit: "Mauro Lima / Unsplash",
      },
      {
        src: "/editions/journal/hanoi-traffic-crop.jpg",
        label: "same corner, cropped — cousin in frame edge",
        credit: "same upload",
      },
    ],
    body: `Took my cousin from Australia through the Old Quarter. He's never crossed Vietnamese traffic before.

Method that actually works (taught by aunt):
• Don't run.
• Don't stop suddenly.
• Walk in a straight line at steady pace.
• Let bikes flow around you like water.

He panicked first try. Second try a street vendor laughed and walked with us. Third try he did it alone and looked way too proud.

Phở lady on plastic stools — 45,000đ, extra herbs without asking. That's how you know you're a regular (we weren't, she was just kind).

Go early morning if you hate heat + horn noise. 7–9am is survivable.`,
    tags: ["#hanoi", "#oldquarter", "#pho", "#motorbike"],
    gameFootnote: {
      gentle:
        "Played the weave game here — score {score}, {misses} crashes. Same as teaching my cousin: slow and embarrassing.",
      steady:
        "In-game: {score} bowls, {misses} bike hits. The 'just walk' tip works better in real life than my thumbs.",
      spark:
        "{score} / {misses} — nailed it in the game before my second coffee. Hanoi wins again.",
    },
  },
];

export function getCommunityPost(editionId: string): CommunityTravelPost | undefined {
  return COMMUNITY_POSTS.find((p) => p.editionId === editionId);
}

export function buildGameFootnote(
  post: CommunityTravelPost,
  tier: PerformanceTier,
  score: number,
  misses: number,
): string {
  return post.gameFootnote[tier]
    .replace(/\{score\}/g, String(score))
    .replace(/\{misses\}/g, String(misses));
}

export const TIER_LABELS_COMMUNITY: Record<PerformanceTier, string> = {
  gentle: "Traveler upload",
  steady: "Trip report · verified",
  spark: "Top contributor",
};
