// ===== Shared client/server types =====

export interface PublicQuestion {
  id: string;
  order: number;
  type: string; // 'choice' | 'picture' | 'reading'
  text: string;
  passage: string;
  emoji: string;
  options: string[];
  points: number;
}

export interface PublicTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  language: string;
  kind: string; // 'points' | 'diagnostic'
  emoji: string;
  color: string;
  timeLimitMin: number;
  allowRetake: boolean;
  accreditation: string;
  ownerName: string;
  questions: PublicQuestion[];
}

export interface ResultLevelInfo {
  code: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  program?: string;
}

export interface SubmitResult {
  attemptId: string;
  mode: string;
  score: number;
  total: number;
  percentage: number;
  stars: number;
  level: ResultLevelInfo;
}

export interface StudentRegInfo {
  name: string;
  phone: string;
  age: string;
  country: string;
}

export interface AttemptRow {
  id: string;
  name: string;
  phone: string;
  age: number;
  country: string;
  testId: string;
  testTitle: string;
  testEmoji: string;
  score: number;
  total: number;
  percentage: number;
  level: string;
  levelName: string;
  program: string;
  wantsInterview: boolean;
  answersJson: string;
  createdAt: string;
}

export interface StudentAttemptRow {
  id: string;
  testTitle: string;
  testEmoji: string;
  score: number;
  total: number;
  percentage: number;
  levelName: string;
  program: string;
  wantsInterview: boolean;
  createdAt: string;
}
