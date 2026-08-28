export const ROSE_EMOTIONS: Record<string, string> = {
  bright: "/rose/bright.png",
  coding: "/rose/coding.png",
  confused: "/rose/confused.png",
  happy: "/rose/happy.png",
  researching: "/rose/researching.png",
  sad: "/rose/sad.png",
  sleeping: "/rose/sleeping.png",
  surprised: "/rose/surprised.png",
  thinking: "/rose/thinking.png",
};

export function extractEmotion(text: string): { cleanText: string; emotion: string } {
  const match = text.match(/<emotion>\s*([a-z]+)\s*<\/emotion>/i);
  if (match) {
    const candidate = match[1].toLowerCase();
    if (ROSE_EMOTIONS[candidate]) {
      const cleanText = text.replace(/<emotion>\s*[a-z]+\s*<\/emotion>/gi, "").trim();
      return { cleanText, emotion: candidate };
    }
  }
  return { cleanText: text.trim(), emotion: "happy" };
}
