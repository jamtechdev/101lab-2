# Auto-Translation Implementation Guide

## What was created

1. **Hook: `useAutoTranslate`** (`src/hooks/useAutoTranslate.ts`)
   - Detects product title language (Chinese vs English)
   - Auto-translates if viewer's language differs
   - Caches results in localStorage for performance

2. **Component: `TranslatedProductTitle`** (`src/components/common/TranslatedProductTitle.tsx`)
   - Wrapper component for easy use

---

## How to Use

### Option 1: Direct Hook (Recommended for most cases)

```tsx
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

function ProductCard({ product }) {
  const { translatedTitle, translatedDescription, isLoading } = useAutoTranslate(
    product.title,
    product.description
  );

  return (
    <div>
      <h3>{translatedTitle}</h3>
      <p>{translatedDescription}</p>
    </div>
  );
}
```

### Option 2: Component Wrapper

```tsx
import TranslatedProductTitle from '@/components/common/TranslatedProductTitle';

function ProductCard({ product }) {
  return (
    <TranslatedProductTitle
      title={product.title}
      description={product.description}
      className="text-lg font-bold"
      descriptionClassName="text-sm text-gray-600"
    />
  );
}
```

---

## Implementation Steps for Your Project

### 1. In `SellerListingDetail.tsx` (line 1034)

**Before:**
```tsx
<h1 className="text-xl font-bold text-foreground leading-tight">{product.title}</h1>
```

**After:**
```tsx
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

// Inside component:
const { translatedTitle } = useAutoTranslate(product.title, product.description);

<h1 className="text-xl font-bold text-foreground leading-tight">{translatedTitle}</h1>
```

### 2. In any product card component

Simply wrap the title display:
```tsx
const { translatedTitle } = useAutoTranslate(product.title);
<h3>{translatedTitle}</h3>
```

### 3. In marketplace listing pages

Same pattern — just use the hook wherever you display `product.title` or `product.name`.

---

## How It Works

1. **Detects source language**: Uses regex to check for Chinese characters (>30% = Chinese, else English)
2. **Compares with viewer's language**: Gets from i18next (`i18n.language`)
3. **If languages match**: No translation needed, shows original
4. **If languages differ**:
   - Checks localStorage cache first
   - If not cached, calls MyMemory API (free, no key needed)
   - Caches result for next time
5. **Returns translated text**: Both title and description

---

## API Used

**MyMemory Translation API**
- Free, no authentication needed
- Endpoint: `https://api.mymemory.translated.net/get?q=TEXT&langpair=from|to`
- Language codes: `en` (English), `zh` (Chinese)

Example:
```
https://api.mymemory.translated.net/get?q=Used%20Machine&langpair=en|zh
→ Response: { responseData: { translatedText: "二手机器" } }
```

---

## Testing

1. **Set language to Chinese**: Change i18n language to `zh`
2. **View English product**: Should auto-translate title & description to Chinese
3. **Set language to English**: Change i18n language to `en`
4. **View Chinese product**: Should auto-translate to English
5. **Check localStorage**: Products you've already translated should be instant (cached)

---

## Performance Notes

- **First translation**: ~500-1000ms (API call)
- **Cached translation**: Instant (localStorage)
- **No translation**: Instant (same language)
- **Caching**: Uses localStorage with key format: `translate_TITLE_FROMLANG_TOLANG`

---

## Fallback Behavior

If translation API fails (offline, API down):
- Returns original text
- Shows no error to user
- Logged to console for debugging
