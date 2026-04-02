export const getChallengeMetrics = () => {
  const start = import.meta.env.VITE_CHALLENGE_START_DATE
    ? new Date(import.meta.env.VITE_CHALLENGE_START_DATE)
    : new Date();
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const day = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  const daysLeft = Math.max(0, 100 - day);
  return { day, daysLeft };
};
