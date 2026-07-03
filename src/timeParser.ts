export interface ParsedTime {
  hour: number; // 0-23
  minute: number; // 0-59
}

interface TimeSpanMatch extends ParsedTime {
  start: number;
  end: number;
}

const NATIVE_HOUR_WORDS: Record<string, number> = {
  열두: 12,
  열한: 11,
  한: 1,
  두: 2,
  세: 3,
  네: 4,
  다섯: 5,
  여섯: 6,
  일곱: 7,
  여덟: 8,
  아홉: 9,
  열: 10,
};

const SINO_DIGIT_WORDS: Record<string, number> = {
  영: 0,
  일: 1,
  이: 2,
  삼: 3,
  사: 4,
  오: 5,
  육: 6,
  칠: 7,
  팔: 8,
  구: 9,
};

// Longest-first so "열두"/"열한" match before the shorter "열".
const NATIVE_HOUR_ALTERNATION = Object.keys(NATIVE_HOUR_WORDS)
  .sort((a, b) => b.length - a.length)
  .join('|');

const TIME_REGEX = new RegExp(
  `(오전|오후|아침|저녁|밤|새벽)?\\s*(?:(\\d{1,2})|(${NATIVE_HOUR_ALTERNATION}))\\s*시` +
    `\\s*(?:(?:(\\d{1,2})|([일이삼사오육칠팔구십]+))\\s*분|(반))?` +
    `\\s*(에는|에|쯤)?`
);

function sinoNumberToInt(text: string): number | null {
  if (text === '십') return 10;
  const match = text.match(/^([일이삼사오육])?십([일이삼사오육칠팔구])?$/);
  if (match) {
    const tens = match[1] ? SINO_DIGIT_WORDS[match[1]] : 1;
    const ones = match[2] ? SINO_DIGIT_WORDS[match[2]] : 0;
    return tens * 10 + ones;
  }
  if (text in SINO_DIGIT_WORDS) return SINO_DIGIT_WORDS[text];
  return null;
}

/**
 * Finds the first spoken/typed Korean time phrase in `text` (e.g. "아침 7시 30분",
 * "일곱시 반", "오후 8시") and returns its value along with the exact character
 * span it occupies, so callers can cut it out of a larger sentence. Returns
 * null if no time phrase is found.
 */
export function extractTimeSpan(text: string): TimeSpanMatch | null {
  const match = TIME_REGEX.exec(text);
  if (!match) return null;

  const [, period, digitHour, nativeHour, digitMinute, sinoMinute, half] = match;

  let hour = digitHour !== undefined ? parseInt(digitHour, 10) : NATIVE_HOUR_WORDS[nativeHour];
  if (hour === undefined || Number.isNaN(hour)) return null;

  let minute = 0;
  if (half) {
    minute = 30;
  } else if (digitMinute !== undefined) {
    minute = parseInt(digitMinute, 10);
  } else if (sinoMinute !== undefined) {
    minute = sinoNumberToInt(sinoMinute) ?? 0;
  }

  if (period === '오후' || period === '저녁' || period === '밤') {
    if (hour < 12) hour += 12;
  } else if (period === '오전' || period === '아침' || period === '새벽') {
    if (hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute, start: match.index, end: match.index + match[0].length };
}

export function parseSpokenTime(raw: string): ParsedTime | null {
  const found = extractTimeSpan(raw);
  return found ? { hour: found.hour, minute: found.minute } : null;
}

const TRAILING_INSTRUCTION_REGEX =
  /(알람\s*)?(맞춰줘|맞춰|설정해줘|설정해줄래|설정해|해줘|해주라|해주세요|부탁해|부탁드려요|챙겨줘|챙겨주라|알려줘)\s*$/;

const STRONG_CONNECTOR_REGEX = /\s*(,|그리고\s*또|그리고|그\s*다음에?|이랑|랑\s|와\s|과\s|및|·|\/)\s*/g;

function splitTasks(text: string): string[] {
  const withoutInstruction = text.replace(TRAILING_INSTRUCTION_REGEX, '').trim();
  if (!withoutInstruction) return [];

  const chunks = withoutInstruction.replace(STRONG_CONNECTOR_REGEX, '|||').split('|||');

  const rawTasks = chunks.flatMap((chunk) => chunk.split(/(?<=고)\s+/));

  const cleaned = rawTasks
    .map((task) =>
      task
        .trim()
        .replace(/^에\s*/, '')
        .replace(/고$/, '')
        .trim()
    )
    .filter(Boolean);

  // Drop duplicates that show up within the same sentence.
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const task of cleaned) {
    if (seen.has(task)) continue;
    seen.add(task);
    deduped.push(task);
  }
  return deduped;
}

export interface MorningSentenceResult {
  time: ParsedTime | null;
  tasks: string[];
}

/**
 * Parses a single spoken sentence that may contain both an alarm time and a
 * list of morning tasks, e.g. "아침 7시 반에 이불정리하고 아침먹고 강아지 산책시키기".
 */
export function parseMorningSentence(raw: string): MorningSentenceResult {
  const timeSpan = extractTimeSpan(raw);
  const rest = timeSpan ? raw.slice(0, timeSpan.start) + raw.slice(timeSpan.end) : raw;

  return {
    time: timeSpan ? { hour: timeSpan.hour, minute: timeSpan.minute } : null,
    tasks: splitTasks(rest),
  };
}

export function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}시 ${minute.toString().padStart(2, '0')}분`;
}
