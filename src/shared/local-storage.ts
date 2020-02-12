const LS_PREFIX = process.env.REACT_APP_NAME;

const computeLocalStorageKey = (key: string) => `${LS_PREFIX}-${key}`;
console.log(`LS_PREFIX = `, LS_PREFIX)

export const getLocalStorage = (key: string, parseAsJson = true) => {
  const val = localStorage.getItem(computeLocalStorageKey(key));
  if (!val) return undefined;

  if (!parseAsJson) return val;

  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
};

export const setLocalStorage = (
  key: string,
  val: any,
  jsonStringify = true
) => {
  return localStorage.setItem(
    computeLocalStorageKey(key),
    jsonStringify ? JSON.stringify(val) : val
  );
};
