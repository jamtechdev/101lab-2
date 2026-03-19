  const parsePhpArray = (meta: string | undefined): string[] => {
    if (!meta) return [];
    try {
      const matches = [...meta.matchAll(/"([^"]+)"/g)];
      return matches.map(m => m[1]);
    } catch (e) {
      return [];
    }
  };