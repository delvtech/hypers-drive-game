export function randNum(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function scale(
  number: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}
