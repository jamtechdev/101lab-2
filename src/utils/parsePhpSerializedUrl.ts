export const extractValuesFromPhpSerialized = (value?: string): string[] => {
  if (!value || typeof value !== "string") return [];

  // Match all serialized string values: s:length:"value";
  const valueRegex = /s:\d+:"(.*?)"/g;

  const results: string[] = [];
  let match;

  while ((match = valueRegex.exec(value)) !== null) {
    results.push(match[1]);
  }

  return results;
};