export type Mood = {
  name: string;
  emoji: string;
};

export type Feeling = string;

export type CheckIn = {
  id: string;
  date: string;
  mood: string;
  feelings: Feeling[];
  details: string;
};

export type MoodValue = {
  [key: string]: number;
}

export type Post = {
  id: string;
  author: string;
  title: string;
  content: string;
  comments: number;
  timestamp: string;
};

export type Choice = {
  scenario: string;
  choice: string;
};
