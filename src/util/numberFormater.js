export const numberFormater = (num) => {
  const truncated = Math.trunc(num);
  return truncated.toLocaleString("de-DE");
};
