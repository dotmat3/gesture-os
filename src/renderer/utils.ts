export const mod = (n: number, m: number) => ((n % m) + m) % m;

export const getTimeString = () => {
  const date = new Date();
  const h = date.getHours();
  const hh = h < 10 ? `0${h}` : h;
  const m = date.getMinutes();
  const mm = m < 10 ? `0${m}` : m;

  return `${hh}:${mm}`;
};

export const getDateString = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default { mod, getTimeString, getDateString };
