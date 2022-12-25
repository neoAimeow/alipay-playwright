export function containsNumber(str: string) {
  return !!str.match(/\d/g);
}

export const containsOnlyNumber = (str: string) => {
  const patrn = /^[0-9]{1,20}$/;
  let bool = true;
  if (!patrn.exec(str)) {
    bool = false;
  }
  return bool;
};
