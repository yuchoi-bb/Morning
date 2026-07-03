export interface ParsedTime {
  hour: number; // 0-23
  minute: number; // 0-59
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
 * Parses a spoken/typed Korean time phrase like "아침 7시 30분", "일곱시 반",
 * "오후 8시" into an { hour, minute } pair. Returns null if it can't find a time.
 */
export function parseSpokenTime(raw: string): ParsedTime | null {
  let text = raw.trim();

  let isPM: boolean | null = null;
  if (/오전|아침|새벽/.test(text)) isPM = false;
  if (/오후|저녁|밤/.test(text)) isPM = true;
  text = text.replace(/오전|오후|아침|저녁|밤|새벽/g, '').trim();

  let hour: number | null = null;

  const digitHourMatch = text.match(/(\d{1,2})\s*시/);
  if (digitHourMatch) {
    hour = parseInt(digitHourMatch[1], 10);
  } else {
    for (const word of Object.keys(NATIVE_HOUR_WORDS)) {
      if (text.includes(`${word}시`)) {
        hour = NATIVE_HOUR_WORDS[word];
        break;
      }
    }
  }

  if (hour === null || Number.isNaN(hour)) return null;

  let minute = 0;
  if (/반/.test(text)) {
    minute = 30;
  }

  const digitMinMatch = text.match(/(\d{1,2})\s*분/);
  if (digitMinMatch) {
    minute = parseInt(digitMinMatch[1], 10);
  } else {
    const sinoMinMatch = text.match(/([일이삼사오육칠팔구십]+)\s*분/);
    if (sinoMinMatch) {
      const val = sinoNumberToInt(sinoMinMatch[1]);
      if (val !== null) minute = val;
    }
  }

  if (isPM === true && hour < 12) hour += 12;
  if (isPM === false && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

export function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}시 ${minute.toString().padStart(2, '0')}분`;
}
