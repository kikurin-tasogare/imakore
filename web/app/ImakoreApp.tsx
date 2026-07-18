"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ThoughtEntry = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  source?: "sample";
};

type Tab = "capture" | "review";

type ThemeInsight = {
  word: string;
  entryIds: string[];
  occurrences: number;
};

type RelatedThought = {
  entry: ThoughtEntry;
  sharedWords: string[];
  score: number;
};

type CenterInsight = {
  headline: string;
  description: string;
  topic?: { label: string; count: number };
  emotion?: { label: string; count: number };
};

const ENTRIES_KEY = "imakore.thoughts.v1";
const DRAFT_KEY = "imakore.draft.v1";
const MINIMUM_ENTRIES_FOR_INSIGHTS = 3;
const ENTRIES_FOR_CURRENT_CENTER = 10;
const THEME_ANALYSIS_WINDOW = 40;
const MAX_IMPORT_BYTES = 1_000_000;
const MAX_IMPORT_ENTRIES = 5_000;
const MAX_IMPORTED_BODY_CHARACTERS = 20_000;
const JAPANESE_WORD_SEGMENTER = new Intl.Segmenter("ja", {
  granularity: "word",
});
const STOP_WORDS = new Set([
  "あの",
  "ある",
  "いる",
  "から",
  "けど",
  "ここ",
  "こと",
  "これ",
  "した",
  "したい",
  "して",
  "する",
  "そして",
  "その",
  "それ",
  "たい",
  "ため",
  "ちゃんと",
  "でも",
  "では",
  "です",
  "ない",
  "なく",
  "なる",
  "ので",
  "まだ",
  "ます",
  "もう",
  "もの",
  "もっと",
  "みたい",
  "よう",
  "やる",
  "より",
  "って",
  "感じる",
  "感じて",
  "気持ち",
  "今日",
  "最近",
  "自分",
  "少し",
  "思う",
  "思って",
]);
const THEME_STOP_WORDS = new Set([
  "いつも",
  "いま",
  "これから",
  "できる",
  "なんか",
  "ちょっと",
  "やっぱり",
  "今回",
  "時間",
  "本当",
  "本当に",
  "大切",
  "感じ",
  "思考",
  "考える",
  "考えて",
  "言葉",
  "毎日",
  "明日",
  "昨日",
  "全部",
  "必要",
]);
const HAS_TOPIC_CHARACTER = /[\p{Script=Han}\p{Script=Katakana}A-Za-z]/u;
const EMOTION_SIGNALS = [
  {
    label: "楽しさ",
    terms: ["楽しい", "楽しかった", "うれしい", "嬉しい", "わくわく", "ワクワク"],
  },
  {
    label: "モヤモヤ",
    terms: ["モヤモヤ", "もやもや", "迷い", "迷って", "引っかかる"],
  },
  {
    label: "不安",
    terms: ["不安", "心配", "怖い", "こわい", "落ち着かない"],
  },
  {
    label: "疲れ",
    terms: ["疲れ", "しんどい", "つらい", "辛い", "大変"],
  },
  {
    label: "落ち着き",
    terms: ["落ち着", "穏やか", "安心", "静か", "軽くな"],
  },
  {
    label: "前向きな気持ち",
    terms: ["やりたい", "楽しみ", "希望", "試したい", "進みたい"],
  },
] as const;
const EMOTION_TOPIC_WORDS = new Set([
  "モヤモヤ",
  "不安",
  "心配",
  "疲れ",
  "安心",
  "静か",
  "楽しみ",
]);

function readEntries(): ThoughtEntry[] {
  try {
    const value = window.localStorage.getItem(ENTRIES_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as ThoughtEntry[];
    return Array.isArray(parsed) ? parsed.filter(isThoughtEntry) : [];
  } catch {
    return [];
  }
}

function isThoughtEntry(value: unknown): value is ThoughtEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ThoughtEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.body === "string" &&
    entry.body.trim().length > 0 &&
    typeof entry.createdAt === "string" &&
    !Number.isNaN(new Date(entry.createdAt).getTime()) &&
    typeof entry.updatedAt === "string" &&
    !Number.isNaN(new Date(entry.updatedAt).getTime())
  );
}

function makeSampleEntries(): ThoughtEntry[] {
  const samples = [
    {
      body: "黄昏の写真を撮っている時間は、考えすぎている頭が静かになる。",
      daysAgo: 0,
    },
    {
      body: "写真を毎日投稿しなくても、撮りたいと思った瞬間を大切にしたい。",
      daysAgo: 1,
    },
    {
      body: "音楽を作りたい気持ちは、まだちゃんとここにある。",
      daysAgo: 2,
    },
    {
      body: "無理に答えを出さなくても、今感じていることを残しておけばいい。",
      daysAgo: 3,
    },
    {
      body: "写真も音楽も、上手にやるより自分の感覚をそのまま表現したい。",
      daysAgo: 4,
    },
    {
      body: "音楽を作る時間を、結果ではなく楽しむために使ってみたい。",
      daysAgo: 5,
    },
  ];

  return samples.map(({ body, daysAgo }, index) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(18 + (index % 4), 8 + index * 5, 0, 0);
    const timestamp = date.toISOString();
    return {
      id: crypto.randomUUID(),
      body,
      createdAt: timestamp,
      updatedAt: timestamp,
      source: "sample" as const,
    };
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLongDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTimeInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function suggestedReminderDate() {
  const now = new Date();
  const suggestion = new Date(now);

  if (now.getHours() < 20) {
    suggestion.setHours(20, 0, 0, 0);
  } else {
    suggestion.setDate(suggestion.getDate() + 1);
    suggestion.setHours(9, 0, 0, 0);
  }

  return suggestion;
}

function reminderDateFor(kind: "later" | "tomorrow") {
  const date = new Date();
  if (kind === "later") {
    date.setMinutes(date.getMinutes() + 60);
    date.setMinutes(date.getMinutes() < 30 ? 30 : 60, 0, 0);
  } else {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }
  return date;
}

function calendarTitle(body: string) {
  const firstLine = body.split(/\r?\n/u).find((line) => line.trim())?.trim() ?? body.trim();
  return Array.from(firstLine).slice(0, 45).join("");
}

function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function formatCalendarUTC(value: Date) {
  return value.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/u, "Z");
}

function makeCalendarFile(entry: ThoughtEntry, startsAt: Date) {
  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const createdAt = new Date(entry.createdAt);
  const safeId = entry.id.replace(/[^A-Za-z0-9._-]/gu, "").slice(0, 64) || crypto.randomUUID();
  const contents = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//imakore//Future Thought//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${safeId}@imakore.local`,
    `DTSTAMP:${formatCalendarUTC(new Date())}`,
    `CREATED:${formatCalendarUTC(createdAt)}`,
    `DTSTART:${formatCalendarUTC(startsAt)}`,
    `DTEND:${formatCalendarUTC(endsAt)}`,
    `SUMMARY:${escapeCalendarText(calendarTitle(entry.body))}`,
    `DESCRIPTION:${escapeCalendarText(`${entry.body}\n\nimakoreから`)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-PT10M",
    `DESCRIPTION:${escapeCalendarText(calendarTitle(entry.body))}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new File([contents], "imakore-calendar.ics", {
    type: "text/calendar;charset=utf-8",
  });
}

function meaningfulWords(body: string): string[] {
  const words = new Set<string>();

  for (const segment of JAPANESE_WORD_SEGMENTER.segment(body.normalize("NFKC"))) {
    if (!segment.isWordLike) continue;

    const word = segment.segment.toLocaleLowerCase("ja-JP").trim();
    if (
      Array.from(word).length < 2 ||
      STOP_WORDS.has(word) ||
      /^\d+$/u.test(word)
    ) {
      continue;
    }
    words.add(word);
  }

  return [...words];
}

function themeWords(body: string): string[] {
  return meaningfulWords(body).filter(
    (word) => HAS_TOPIC_CHARACTER.test(word) && !THEME_STOP_WORDS.has(word),
  );
}

function findRelatedThoughts(
  target: ThoughtEntry,
  entries: ThoughtEntry[],
  limit = 3,
): RelatedThought[] {
  const targetWords = new Set(themeWords(target.body));
  if (targetWords.size === 0) return [];

  return entries
    .filter((entry) => entry.id !== target.id)
    .map((entry) => {
      const candidateWords = themeWords(entry.body);
      const sharedWords = candidateWords.filter((word) => targetWords.has(word));
      const sharedCharacterCount = sharedWords.reduce(
        (total, word) => total + Array.from(word).length,
        0,
      );
      const score =
        sharedWords.length * 10 +
        sharedCharacterCount -
        Math.abs(candidateWords.length - targetWords.size) * 0.1;
      return { entry, sharedWords, score };
    })
    .filter((result) => result.sharedWords.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.entry.createdAt).getTime() -
          new Date(a.entry.createdAt).getTime(),
    )
    .slice(0, limit);
}

function analyzeThemes(entries: ThoughtEntry[]): ThemeInsight[] {
  if (entries.length < MINIMUM_ENTRIES_FOR_INSIGHTS) return [];

  const recentEntries = [...entries]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, THEME_ANALYSIS_WINDOW);
  const themes = new Map<
    string,
    { entryIds: Set<string>; occurrences: number; recencyScore: number }
  >();
  recentEntries.forEach((entry, index) => {
    const recencyWeight = Math.max(
      0.25,
      1 - index / Math.max(recentEntries.length, 1),
    );

    themeWords(entry.body).forEach((word) => {
      const current = themes.get(word) ?? {
        entryIds: new Set<string>(),
        occurrences: 0,
        recencyScore: 0,
      };
      current.occurrences += 1;
      current.entryIds.add(entry.id);
      current.recencyScore += recencyWeight;
      themes.set(word, current);
    });
  });

  return [...themes.entries()]
    .filter(([, value]) => value.entryIds.size >= 2)
    .sort((a, b) => {
      const score = (word: string, value: (typeof a)[1]) =>
        value.entryIds.size * 2 +
        value.recencyScore +
        Math.min(Array.from(word).length, 8) * 0.08;
      return score(b[0], b[1]) - score(a[0], a[1]);
    })
    .slice(0, 3)
    .map(([word, value]) => ({
      word,
      entryIds: [...value.entryIds],
      occurrences: value.occurrences,
    }));
}

function analyzeCurrentCenter(entries: ThoughtEntry[]): CenterInsight | null {
  if (entries.length < ENTRIES_FOR_CURRENT_CENTER) return null;

  const recentEntries = [...entries]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, ENTRIES_FOR_CURRENT_CENTER);
  const topic = analyzeThemes(recentEntries).find(
    (theme) => !EMOTION_TOPIC_WORDS.has(theme.word),
  );
  const emotions = EMOTION_SIGNALS.map((signal) => {
    let count = 0;
    let recencyScore = 0;

    recentEntries.forEach((entry, index) => {
      const normalizedBody = entry.body.normalize("NFKC").toLocaleLowerCase("ja-JP");
      const appears = signal.terms.some((term) =>
        normalizedBody.includes(term.normalize("NFKC").toLocaleLowerCase("ja-JP")),
      );
      if (!appears) return;

      count += 1;
      recencyScore += 1 - index / ENTRIES_FOR_CURRENT_CENTER;
    });

    return { label: signal.label, count, recencyScore };
  })
    .filter((emotion) => emotion.count >= 2)
    .sort(
      (a, b) =>
        b.count - a.count || b.recencyScore - a.recencyScore,
    );
  const emotion = emotions[0];

  if (topic && emotion) {
    return {
      headline: `「${topic.word}」と、${emotion.label}が今の中心にあります`,
      description: `直近10件では「${topic.word}」が${topic.entryIds.length}件、${emotion.label}を含む言葉が${emotion.count}件に現れました。`,
      topic: { label: topic.word, count: topic.entryIds.length },
      emotion: { label: emotion.label, count: emotion.count },
    };
  }

  if (topic) {
    return {
      headline: `「${topic.word}」のことが、今の中心にあります`,
      description: `直近10件のうち、${topic.entryIds.length}件に同じテーマが現れました。`,
      topic: { label: topic.word, count: topic.entryIds.length },
    };
  }

  if (emotion) {
    return {
      headline: `${emotion.label}が、今の気持ちの中心にあります`,
      description: `直近10件のうち、${emotion.count}件に近い気持ちが現れました。`,
      emotion: { label: emotion.label, count: emotion.count },
    };
  }

  return {
    headline: "いくつかの気持ちが、今ここに並んでいます",
    description: "直近10件では、まだ一つの中心に絞らず、そのまま残しておける状態です。",
  };
}

export function ImakoreApp() {
  const [tab, setTab] = useState<Tab>("capture");
  const [entries, setEntries] = useState<ThoughtEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [selectedThemeWord, setSelectedThemeWord] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [calendarEntry, setCalendarEntry] = useState<ThoughtEntry | null>(null);
  const [reminderDate, setReminderDate] = useState(() =>
    formatDateTimeInput(suggestedReminderDate()),
  );
  const [calendarMessage, setCalendarMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEntries(readEntries());
      setDraft(window.localStorage.getItem(DRAFT_KEY) ?? "");
      setIsReady(true);
    });

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!calendarEntry) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCalendarEntry(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [calendarEntry]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [entries],
  );

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const selectedEntryEchoes = useMemo(
    () =>
      selectedEntry ? findRelatedThoughts(selectedEntry, entries) : [],
    [entries, selectedEntry],
  );
  const lastSavedEntry = useMemo(
    () => entries.find((entry) => entry.id === lastSavedId) ?? null,
    [entries, lastSavedId],
  );
  const lastSavedEchoes = useMemo(
    () =>
      lastSavedEntry ? findRelatedThoughts(lastSavedEntry, entries, 2) : [],
    [entries, lastSavedEntry],
  );

  const themeInsights = useMemo(() => analyzeThemes(entries), [entries]);
  const personalEntries = useMemo(
    () => entries.filter((entry) => entry.source !== "sample"),
    [entries],
  );
  const currentCenter = useMemo(
    () => analyzeCurrentCenter(personalEntries),
    [personalEntries],
  );
  const selectedTheme =
    themeInsights.find((theme) => theme.word === selectedThemeWord) ?? null;
  const themeFilteredEntries = selectedTheme
    ? sortedEntries.filter((entry) => selectedTheme.entryIds.includes(entry.id))
    : sortedEntries;
  const normalizedSearchQuery = searchQuery
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP");
  const visibleEntries = normalizedSearchQuery
    ? themeFilteredEntries.filter((entry) =>
        entry.body
          .normalize("NFKC")
          .toLocaleLowerCase("ja-JP")
          .includes(normalizedSearchQuery),
      )
    : themeFilteredEntries;
  const hasSampleEntries = entries.some((entry) => entry.source === "sample");

  function commitEntries(next: ThoughtEntry[]) {
    setEntries(next);
    window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (value.trim()) setLastSavedId(null);
    if (value) {
      window.localStorage.setItem(DRAFT_KEY, value);
    } else {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }

  function saveThought() {
    const body = draft.trim();
    if (!body) return;

    const now = new Date().toISOString();
    const entry: ThoughtEntry = {
      id: crypto.randomUUID(),
      body,
      createdAt: now,
      updatedAt: now,
    };
    commitEntries([entry, ...entries]);
    setLastSavedId(entry.id);
    updateDraft("");
    textareaRef.current?.blur();

    if (navigator.vibrate) navigator.vibrate(18);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSavedMessage(true);
    savedTimer.current = setTimeout(() => setSavedMessage(false), 1800);
  }

  function openEntry(id: string) {
    setSelectedId(id);
    setEditing(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function openCalendarSheet(entry: ThoughtEntry) {
    setCalendarEntry(entry);
    setReminderDate(formatDateTimeInput(suggestedReminderDate()));
    setCalendarMessage("");
  }

  async function handToCalendar() {
    if (!calendarEntry) return;
    const startsAt = new Date(reminderDate);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      setCalendarMessage("これからの日時を選んでください。");
      return;
    }

    const file = makeCalendarFile(calendarEntry, startsAt);
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: calendarTitle(calendarEntry.body),
          text: "未来の自分に渡す予定です。",
        });
        setCalendarMessage("共有先で予定ファイルを開き、カレンダーに追加してください。");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setCalendarMessage("予定ファイルを開き、「追加」を押してください。");
  }

  function beginEditing() {
    if (!selectedEntry) return;
    setEditDraft(selectedEntry.body);
    setEditing(true);
  }

  function saveEdit() {
    const body = editDraft.trim();
    if (!selectedEntry || !body) return;

    commitEntries(
      entries.map((entry) =>
        entry.id === selectedEntry.id
          ? { ...entry, body, updatedAt: new Date().toISOString() }
          : entry,
      ),
    );
    setEditing(false);
  }

  function deleteEntry() {
    if (!selectedEntry) return;
    const shouldDelete = window.confirm(
      "この思考を削除しますか？\n\n削除した思考は元に戻せません。",
    );
    if (!shouldDelete) return;

    commitEntries(entries.filter((entry) => entry.id !== selectedEntry.id));
    setSelectedId(null);
    setEditing(false);
  }

  function switchTab(nextTab: Tab) {
    setTab(nextTab);
    setSelectedId(null);
    setEditing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addSampleEntries() {
    commitEntries(makeSampleEntries());
    setDataMessage("サンプルを追加しました。テーマを押して流れを見てみましょう。");
  }

  function removeSampleEntries() {
    if (!window.confirm("サンプルの思考だけを削除しますか？")) return;
    commitEntries(entries.filter((entry) => entry.source !== "sample"));
    setSelectedThemeWord(null);
    setSearchQuery("");
    setDataMessage("サンプルを削除しました。");
  }

  function exportEntries() {
    const payload = JSON.stringify(
      {
        app: "imakore",
        version: 1,
        exportedAt: new Date().toISOString(),
        entries,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `imakore-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDataMessage("記録を書き出しました。");
  }

  async function importEntries(file: File) {
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("file too large");
      const parsed = JSON.parse(await file.text()) as unknown;
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "entries" in parsed
          ? (parsed as { entries: unknown }).entries
          : null;
      if (!Array.isArray(candidates)) throw new Error("invalid file");

      if (candidates.length > MAX_IMPORT_ENTRIES) {
        throw new Error("too many entries");
      }

      const imported = candidates.filter(
        (candidate): candidate is ThoughtEntry =>
          isThoughtEntry(candidate) &&
          Array.from(candidate.body).length <= MAX_IMPORTED_BODY_CHARACTERS &&
          candidate.id.length <= 128,
      );
      if (imported.length === 0) throw new Error("no entries");

      const merged = new Map(entries.map((entry) => [entry.id, entry]));
      imported.forEach((entry) => merged.set(entry.id, entry));
      commitEntries([...merged.values()]);
      setDataMessage(`${imported.length}件の記録を読み込みました。`);
    } catch {
      setDataMessage("読み込めませんでした。imakoreの書き出しファイルを選んでください。");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  if (!isReady) {
    return (
      <main className="app-shell loading-shell" aria-label="imakoreを読み込み中">
        <div className="loading-dot" />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-surface">
        {selectedEntry ? (
          <DetailView
            entry={selectedEntry}
            editing={editing}
            editDraft={editDraft}
            onBack={() => {
              setSelectedId(null);
              setEditing(false);
            }}
            onBeginEditing={beginEditing}
            onEditDraftChange={setEditDraft}
            onCancelEditing={() => setEditing(false)}
            onSaveEdit={saveEdit}
            onDelete={deleteEntry}
            onHandToFuture={() => openCalendarSheet(selectedEntry)}
            relatedThoughts={selectedEntryEchoes}
            onOpenRelated={openEntry}
          />
        ) : tab === "capture" ? (
          <section className="screen capture-screen" aria-labelledby="capture-title">
            <header className="screen-header compact-header">
              <p className="brand-mark">imakore</p>
              <h1 id="capture-title">今、何が頭にある？</h1>
              <p className="screen-intro">思いついたことを、そのまま書いてみる</p>
            </header>

            <div className="capture-content">
              <label className="sr-only" htmlFor="thought-input">
                今、頭にあること
              </label>
              <textarea
                ref={textareaRef}
                id="thought-input"
                value={draft}
                onChange={(event) => updateDraft(event.target.value)}
                placeholder="ここに置いていく"
                rows={9}
                enterKeyHint="done"
              />

              <button
                className="primary-button"
                type="button"
                disabled={!draft.trim()}
                onClick={saveThought}
                aria-describedby="save-feedback"
              >
                残す
              </button>

              <div
                id="save-feedback"
                className={`save-feedback ${savedMessage ? "is-visible" : ""}`}
                role="status"
                aria-live="polite"
              >
                <span className="checkmark" aria-hidden="true">✓</span>
                残しました
              </div>

              {lastSavedEntry && lastSavedEchoes.length > 0 && (
                <EchoPanel
                  title="前にも、似た思考がありました"
                  description="過去の自分から返ってきた、思考のこだまです。"
                  relatedThoughts={lastSavedEchoes}
                  onOpen={openEntry}
                  onDismiss={() => setLastSavedId(null)}
                />
              )}
            </div>
          </section>
        ) : (
          <section className="screen review-screen" aria-labelledby="review-title">
            <header className="screen-header">
              <p className="brand-mark">imakore</p>
              <h1 id="review-title">振り返る</h1>
            </header>

            {sortedEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-symbol" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <h2>まだ思考はありません</h2>
                <p>書くだけで大丈夫。整理や分類はimakoreに任せてください。</p>
                <ol className="first-steps" aria-label="imakoreの使い方">
                  <li><span>1</span>頭にあることを、そのまま残す</li>
                  <li><span>2</span>言葉の繰り返しを自動で見つける</li>
                  <li><span>3</span>過去の自分の流れに気づく</li>
                </ol>
                <button className="sample-button" type="button" onClick={addSampleEntries}>
                  サンプルで体験する
                </button>
                <small>サンプルはいつでも消せます</small>
              </div>
            ) : (
              <>
                {hasSampleEntries && (
                  <aside className="sample-notice">
                    <p><strong>サンプル表示中</strong><span>分析の流れを試せます</span></p>
                    <button type="button" onClick={removeSampleEntries}>サンプルを消す</button>
                  </aside>
                )}

                {currentCenter ? (
                  <section className="center-card" aria-labelledby="center-title">
                    <p className="center-eyebrow">今の気持ちの中心</p>
                    <h2 id="center-title">{currentCenter.headline}</h2>
                    <p className="center-description">{currentCenter.description}</p>
                    {(currentCenter.topic || currentCenter.emotion) && (
                      <div className="center-signals" aria-label="中心として見つかった傾向">
                        {currentCenter.topic && (
                          <span>
                            話題　{currentCenter.topic.label}
                            <small>{currentCenter.topic.count}/10件</small>
                          </span>
                        )}
                        {currentCenter.emotion && (
                          <span>
                            気持ち　{currentCenter.emotion.label}
                            <small>{currentCenter.emotion.count}/10件</small>
                          </span>
                        )}
                      </div>
                    )}
                    <p className="local-analysis-note">
                      直近10件の言葉から、端末内で見つけた傾向です
                    </p>
                  </section>
                ) : (
                  <section className="center-progress" aria-labelledby="center-progress-title">
                    <p>今の気持ちの中心</p>
                    <h2 id="center-progress-title">
                      あと{ENTRIES_FOR_CURRENT_CENTER - personalEntries.length}件ほど残すと、今の流れが見えてきます
                    </h2>
                    <small>急がなくて大丈夫。思いついたときに、そのまま残してください。</small>
                  </section>
                )}

                {themeInsights.length > 0 && (
                  <section className="insight-card" aria-labelledby="insight-title">
                    <p className="insight-eyebrow">思考の流れ</p>
                    <h2 id="insight-title">最近、何度も現れていること</h2>
                    <p className="insight-description">
                      言葉を押すと、関係する思考を振り返れます。
                    </p>
                    <div className="theme-list" aria-label="繰り返しているテーマ">
                      {themeInsights.map((theme) => (
                        <button
                          key={theme.word}
                          type="button"
                          className={selectedTheme?.word === theme.word ? "is-active" : ""}
                          onClick={() =>
                            setSelectedThemeWord(
                              selectedTheme?.word === theme.word ? null : theme.word,
                            )
                          }
                          aria-pressed={selectedTheme?.word === theme.word}
                        >
                          <span>{theme.word}</span>
                          <small>{theme.entryIds.length}つの思考</small>
                        </button>
                      ))}
                    </div>
                    <p className="local-analysis-note">
                      最近の記録から、一般的な言葉を除いて端末内で分析しています
                    </p>
                  </section>
                )}

                <div className="search-box">
                  <label className="sr-only" htmlFor="thought-search">思考を検索</label>
                  <span className="search-symbol" aria-hidden="true" />
                  <input
                    id="thought-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="思考を検索"
                    autoComplete="off"
                  />
                </div>

                {selectedTheme && (
                  <div className="filter-summary" role="status">
                    <p>「{selectedTheme.word}」に関する思考</p>
                    <button type="button" onClick={() => setSelectedThemeWord(null)}>
                      すべて表示
                    </button>
                  </div>
                )}

                <ol className="thought-list" aria-label="保存した思考">
                  {visibleEntries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        className="thought-card"
                        type="button"
                        onClick={() => openEntry(entry.id)}
                        aria-label={`${entry.body}、${formatDateTime(entry.createdAt)}。詳細を開く`}
                      >
                        <span className="thought-body">{entry.body}</span>
                        <time dateTime={entry.createdAt}>
                          {formatDateTime(entry.createdAt)}
                        </time>
                      </button>
                    </li>
                  ))}
                </ol>

                {visibleEntries.length === 0 && (
                  <div className="no-results" role="status">
                    <p>一致する思考はありません</p>
                    <button type="button" onClick={() => setSearchQuery("")}>検索をクリア</button>
                  </div>
                )}

                <details className="data-tools">
                  <summary>記録を守る</summary>
                  <div>
                    <p>データはこの端末内にあります。機種変更やブラウザデータの消去に備えて、ファイルに保存できます。</p>
                    <div className="data-actions">
                      <button type="button" onClick={exportEntries}>書き出す</button>
                      <button type="button" onClick={() => importInputRef.current?.click()}>読み込む</button>
                    </div>
                    <input
                      ref={importInputRef}
                      className="sr-only"
                      type="file"
                      accept="application/json,.json"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void importEntries(file);
                      }}
                    />
                    {dataMessage && <p className="data-message" role="status">{dataMessage}</p>}
                  </div>
                </details>
              </>
            )}
          </section>
        )}

        {!selectedEntry && (
          <nav className="tab-bar" aria-label="メインメニュー">
            <button
              type="button"
              className={tab === "capture" ? "is-active" : ""}
              onClick={() => switchTab("capture")}
              aria-current={tab === "capture" ? "page" : undefined}
            >
              <span className="tab-icon pencil-icon" aria-hidden="true" />
              <span>残す</span>
            </button>
            <button
              type="button"
              className={tab === "review" ? "is-active" : ""}
              onClick={() => switchTab("review")}
              aria-current={tab === "review" ? "page" : undefined}
            >
              <span className="tab-icon book-icon" aria-hidden="true">
                <i />
                <i />
              </span>
              <span>振り返る</span>
            </button>
          </nav>
        )}


        {calendarEntry && (
          <div
            className="calendar-sheet-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCalendarEntry(null);
            }}
          >
            <section
              className="calendar-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="calendar-sheet-title"
            >
              <div className="sheet-handle" aria-hidden="true" />
              <button
                type="button"
                className="sheet-close"
                onClick={() => setCalendarEntry(null)}
                aria-label="未来の自分に渡す画面を閉じる"
              >
                ×
              </button>
              <p className="sheet-eyebrow">未来の自分に渡す</p>
              <h2 id="calendar-sheet-title">いつ、もう一度思い出す？</h2>
              <p className="sheet-description">
                今すぐ決めなくても大丈夫。選んだときだけAppleカレンダーへ渡します。
              </p>

              <div className="reminder-shortcuts" aria-label="思い出す日時の候補">
                <button
                  type="button"
                  onClick={() => setReminderDate(formatDateTimeInput(reminderDateFor("later")))}
                >
                  このあと
                </button>
                <button
                  type="button"
                  onClick={() => setReminderDate(formatDateTimeInput(reminderDateFor("tomorrow")))}
                >
                  明日の朝
                </button>
              </div>

              <label className="reminder-date-label" htmlFor="reminder-date">
                日時を選ぶ
              </label>
              <input
                id="reminder-date"
                className="reminder-date-input"
                type="datetime-local"
                value={reminderDate}
                min={formatDateTimeInput(new Date())}
                onChange={(event) => {
                  setReminderDate(event.target.value);
                  setCalendarMessage("");
                }}
              />

              <div className="calendar-preview">
                <span>予定名</span>
                <strong>{calendarTitle(calendarEntry.body)}</strong>
                <small>30分の予定・10分前に通知</small>
              </div>

              <button className="primary-button" type="button" onClick={() => void handToCalendar()}>
                Appleカレンダーに渡す
              </button>
              <p className="calendar-privacy-note">
                内容は外部サーバーへ送らず、この端末で予定ファイルを作ります。
              </p>
              {calendarMessage && (
                <p className="calendar-message" role="status" aria-live="polite">
                  {calendarMessage}
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

type DetailViewProps = {
  entry: ThoughtEntry;
  editing: boolean;
  editDraft: string;
  onBack: () => void;
  onBeginEditing: () => void;
  onEditDraftChange: (value: string) => void;
  onCancelEditing: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onHandToFuture: () => void;
  relatedThoughts: RelatedThought[];
  onOpenRelated: (id: string) => void;
};

function DetailView({
  entry,
  editing,
  editDraft,
  onBack,
  onBeginEditing,
  onEditDraftChange,
  onCancelEditing,
  onSaveEdit,
  onDelete,
  onHandToFuture,
  relatedThoughts,
  onOpenRelated,
}: DetailViewProps) {
  return (
    <section className="screen detail-screen" aria-labelledby="detail-title">
      <header className="detail-toolbar">
        <button type="button" className="back-button" onClick={onBack}>
          <span aria-hidden="true">‹</span> 戻る
        </button>
        <h1 id="detail-title">思考</h1>
        {!editing ? (
          <button type="button" className="edit-button" onClick={onBeginEditing}>
            編集
          </button>
        ) : (
          <span className="toolbar-spacer" />
        )}
      </header>

      <div className="detail-content">
        {editing ? (
          <div className="edit-panel">
            <label className="sr-only" htmlFor="edit-input">
              思考の内容を編集
            </label>
            <textarea
              id="edit-input"
              autoFocus
              value={editDraft}
              onChange={(event) => onEditDraftChange(event.target.value)}
              rows={12}
            />
            <div className="edit-actions">
              <button type="button" className="secondary-button" onClick={onCancelEditing}>
                キャンセル
              </button>
              <button
                type="button"
                className="primary-button compact"
                disabled={!editDraft.trim()}
                onClick={onSaveEdit}
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <p className="detail-body">{entry.body}</p>
        )}

        <div className="detail-divider" />
        <div className="created-at">
          <span>残した日時</span>
          <time dateTime={entry.createdAt}>{formatLongDateTime(entry.createdAt)}</time>
        </div>

        {!editing && (
          <button type="button" className="future-button" onClick={onHandToFuture}>
            <span className="future-icon" aria-hidden="true">↗</span>
            <span>
              <strong>未来の自分に渡す</strong>
              <small>思い出したい日時を選ぶ</small>
            </span>
          </button>
        )}

        {!editing && relatedThoughts.length > 0 && (
          <EchoPanel
            title="この思考につながる記録"
            description="同じ言葉が現れた過去の思考です。"
            relatedThoughts={relatedThoughts}
            onOpen={onOpenRelated}
          />
        )}

        {!editing && (
          <button type="button" className="delete-button" onClick={onDelete}>
            削除
          </button>
        )}
      </div>
    </section>
  );
}

type EchoPanelProps = {
  title: string;
  description: string;
  relatedThoughts: RelatedThought[];
  onOpen: (id: string) => void;
  onDismiss?: () => void;
};

function EchoPanel({
  title,
  description,
  relatedThoughts,
  onOpen,
  onDismiss,
}: EchoPanelProps) {
  return (
    <section className="echo-panel" aria-labelledby={`echo-${relatedThoughts[0].entry.id}`}>
      <div className="echo-heading">
        <div>
          <p className="echo-eyebrow">思考のこだま</p>
          <h2 id={`echo-${relatedThoughts[0].entry.id}`}>{title}</h2>
        </div>
        {onDismiss && (
          <button type="button" className="echo-dismiss" onClick={onDismiss} aria-label="思考のこだまを閉じる">
            ×
          </button>
        )}
      </div>
      <p className="echo-description">{description}</p>
      <ol className="echo-list">
        {relatedThoughts.map(({ entry, sharedWords }) => (
          <li key={entry.id}>
            <button type="button" onClick={() => onOpen(entry.id)}>
              <span className="echo-words">
                {sharedWords.slice(0, 3).map((word) => `#${word}`).join("  ")}
              </span>
              <span className="echo-body">{entry.body}</span>
              <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
            </button>
          </li>
        ))}
      </ol>
      <p className="local-analysis-note">この端末内の言葉だけで見つけています</p>
    </section>
  );
}
