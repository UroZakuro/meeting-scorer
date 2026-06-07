export type Utterance = {
  speaker: string | null;
  text: string;
};

export type SpeakerStat = {
  speaker: string;
  utteranceCount: number;
  charCount: number;
  sharePercent: number;
  fillerCount: number;
  estimatedMinutes: number;
};

export type AxisResult = {
  id: number;
  name: string;
  deduction: number;
  comment: string;
  evidenceQuote: string;
};

export type Evaluation = {
  overallScore: number;
  oneLineVerdict: string;
  wasMeetingNecessary: { necessary: boolean; reason: string };
  couldHaveBeenShortenedMinutes: number;
  axes: AxisResult[];
  improvements: string[];
};

export type MeetingResult = {
  id: string;
  createdAt: string;
  durationMinutes: number | null;
  participantCount: number | null;
  speakerStats: SpeakerStat[];
  evaluation: Evaluation;
};
