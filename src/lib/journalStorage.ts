export type JournalDraft = {
  /** Travel destination for this journal (independent of user's current IP locale) */
  travelLocaleId: string;
  instagramUrl: string;
  twitterUrl: string;
  images: string[];
  narrative: string;
  updatedAt: string;
};

const KEY = "travel_memory_journal_v1";

export function loadJournal(): JournalDraft {
  try {
    const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    if (!raw) return emptyJournal();
    const j = JSON.parse(raw) as JournalDraft;
    if (!Array.isArray(j.images)) return emptyJournal();
    return {
      travelLocaleId: (j as any).travelLocaleId || "cn",
      instagramUrl: j.instagramUrl || "",
      twitterUrl: j.twitterUrl || "",
      images: j.images,
      narrative: j.narrative || "",
      updatedAt: j.updatedAt || new Date().toISOString(),
    };
  } catch {
    return emptyJournal();
  }
}

export function emptyJournal(): JournalDraft {
  return {
    travelLocaleId: "cn",
    instagramUrl: "",
    twitterUrl: "",
    images: [],
    narrative: "",
    updatedAt: new Date().toISOString(),
  };
}

export function saveJournal(j: JournalDraft) {
  const payload = JSON.stringify({ ...j, updatedAt: new Date().toISOString() });
  try {
    sessionStorage.setItem(KEY, payload);
    localStorage.setItem(KEY, payload);
  } catch {
    try {
      sessionStorage.setItem(KEY, payload);
    } catch {
      /* quota */
    }
  }
}
