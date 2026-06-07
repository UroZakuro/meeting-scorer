export type SpeakerStat = {
  speaker: string;
  utteranceCount: number;
  charCount: number;
  sharePercent: number;
  fillerCount: number;
  estimatedMinutes: number;
};

export type EvaluateRequest = {
  transcript: string;
  speakerStats: SpeakerStat[];
  durationMinutes: number | null;
  participantCount: number | null;
};
