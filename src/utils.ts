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

/**
 * Get the greatest common divisor of a list of numbers.
 */
export function gcd(...numbers: number[]) {
  let final = Math.abs(numbers[0]);
  for (let i = 1; i < numbers.length; i++) {
    let x = final;
    let y = Math.abs(numbers[i]);
    while (x) {
      var t = x;
      x = y % x;
      y = t;
    }
    final = y;
  }
  return final;
}

export function commify(number: number | string, decimals: number = 2) {
  const parts = number.toString().split(".");
  const fraction: string | undefined = parts[1]?.slice(0, decimals);

  return `${parts[0].replace(/(?<!^)(?=(\d{3})+$)/g, ",")}${
    fraction ? `.${fraction}` : ""
  }`;
}
