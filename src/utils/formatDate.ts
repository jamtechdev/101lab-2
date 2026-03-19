// utils/formatDate.ts
export const formatDate = (date: string | Date, lang: string) => {

    console.log("lang is",lang);
    
  const localeMap: Record<string, string> = {
    en: "en-US",
    "zh": "zh-TW",
  };

  return new Date(date).toLocaleDateString(
    localeMap[lang] || "en-US",
    {
      year: "numeric",
      month: lang === "zh-TW" ? "numeric" : "short",
      day: "numeric",
    }
  );
};
