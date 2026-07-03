import * as Speech from 'expo-speech';

export function speak(text: string, onDone?: () => void): void {
  Speech.stop();
  Speech.speak(text, {
    language: 'ko-KR',
    pitch: 1.0,
    rate: 0.95,
    onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
