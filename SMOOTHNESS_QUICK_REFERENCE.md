# ⚡ Smoothness Quick Reference Card

## 🎯 Essential Imports

```typescript
// Skeletons (loading placeholders)
import { ProductCardSkeleton, ListItemSkeleton, DetailPageSkeleton } from '@/components/common/Skeletons';

// Page transitions
import { PageTransition, AnimatedSection, StaggeredList } from '@/components/common/PageTransition';

// Loading bars
import { AutoLoadingBar, CircularProgress, StepProgress } from '@/components/common/LoadingBar';

// Interactive components
import { SmoothButton, SmoothCard, SmoothTabs, SmoothInput } from '@/components/common/SmoothInteractions';

// Scroll effects
import { ScrollToTopButton, ScrollProgress, ScrollNav } from '@/components/common/SmoothScroll';

// Utilities
import { debounce, throttle, shouldDisableAnimations } from '@/utils/smoothnessUtils';
```

---

## 📱 Common Patterns

### Pattern 1: Loading State

```typescript
const [isLoading, setIsLoading] = useState(true);

if (isLoading) return <ProductCardSkeleton count={6} />;
return <YourContent />;
```

### Pattern 2: Page Wrapper

```typescript
<PageTransition type="fade">
  <div>Your page content</div>
</PageTransition>
```

### Pattern 3: Animated List

```typescript
<StaggeredList staggerDelay={0.1}>
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</StaggeredList>
```

### Pattern 4: Smooth Button

```typescript
<SmoothButton variant="primary" onClick={handleClick}>
  Click Me
</SmoothButton>
```

---

## 🎨 CSS Classes (No Import Needed)

### Hover Effects
```html
<button class="hover-scale-105">Hover Scale</button>
<div class="card hover-lift">Lift on Hover</div>
<button class="hover-glow">Glow Effect</button>
```

### Animations
```html
<div class="animate-fade-in">Fade In</div>
<div class="animate-slide-in-left">Slide Left</div>
<div class="animate-bounce-in">Bounce In</div>
<div class="animate-shimmer">Loading</div>
```

### Buttons
```html
<button class="btn-smooth-primary">Primary</button>
<button class="btn-smooth-secondary">Secondary</button>
<button class="btn-smooth-ghost">Ghost</button>
<button class="btn-smooth-danger">Danger</button>
```

---

## 🎬 Animation Types

| Type | Component | Duration |
|------|-----------|----------|
| Fade | `fadeInVariants` | 0.5s |
| Slide | `slideInVariants` | 0.5s |
| Scale | `scaleInVariants` | 0.3s |
| Bounce | `bounceIn` | 0.6s |
| Shimmer | `.animate-shimmer` | 2s |

---

## 🎯 Use Cases

### Product Loading
```typescript
<ProductCardSkeleton count={6} />
```

### Detail Page
```typescript
<DetailPageSkeleton /> // While loading
```

### List Loading
```typescript
<ListItemSkeleton count={5} />
```

### Table Loading
```typescript
<TableSkeleton rows={10} cols={4} />
```

### Progress Upload
```typescript
<CircularProgress progress={75} />
```

### Multi-Step Form
```typescript
<StepProgress currentStep={2} totalSteps={4} />
```

### Animated Content
```typescript
<AnimatedSection delay={0.2}>
  Your content
</AnimatedSection>
```

### Staggered List
```typescript
<StaggeredList staggerDelay={0.1}>
  {items.map(item => <div key={item.id}>{item}</div>)}
</StaggeredList>
```

---

## ⚙️ Component Props

### PageTransition
```typescript
<PageTransition
  type="fade" | "slide" | "slideUp" | "slideDown" | "scale"
  duration={0.4}
  delay={0}
/>
```

### SmoothButton
```typescript
<SmoothButton
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  isLoading={false}
  icon={<Icon />}
/>
```

### StaggeredList
```typescript
<StaggeredList staggerDelay={0.1} className="space-y-2">
  {items.map(item => ...)}
</StaggeredList>
```

### LoadingBar
```typescript
<AutoLoadingBar isComplete={!isLoading} />
```

### ScrollToTopButton
```typescript
<ScrollToTopButton showAfter={300} duration={0.6} />
```

---

## 💡 Pro Tips

1. **Always use skeletons** instead of spinners for better UX
2. **Wrap pages** with `PageTransition` for smooth navigation
3. **Use `debounce`** for search/input events (300ms)
4. **Use `throttle`** for scroll events (100ms)
5. **Add progress bar** for long operations
6. **Test on mobile** - animations should be 60 FPS
7. **Respect `prefers-reduced-motion`** (automatic)
8. **Use stagger** for lists to draw attention

---

## 🔧 Setup (One Time)

1. Import CSS in `main.tsx`:
```typescript
import './styles/smoothness.css';
```

2. Enable smooth scroll (optional):
```typescript
import { enableSmoothScroll } from '@/utils/smoothnessUtils';

useEffect(() => {
  enableSmoothScroll();
}, []);
```

That's it! Everything is ready to use.

---

## 📊 Bundle Size Impact

- **Framer Motion:** ~45 KB (gzipped)
- **Skeletons CSS:** ~2 KB
- **Animation CSS:** ~3 KB
- **Utilities:** ~5 KB
- **Total:** ~55 KB added

No performance penalty - all animations use GPU acceleration.

---

## ❌ What NOT to Do

- ❌ Don't add animations to every element
- ❌ Don't use duration > 1s for most animations
- ❌ Don't nest too many Framer Motion components
- ❌ Don't disable animations globally (respect user preference)
- ❌ Don't forget accessibility (keyboard navigation)

---

## ✅ What TO Do

- ✅ Use skeletons for loading states
- ✅ Animate on interaction (hover, click)
- ✅ Use consistent timing (200-500ms)
- ✅ Keep animations subtle and purposeful
- ✅ Test on actual devices
- ✅ Profile performance (DevTools)

---

## 🚀 Quick Implementation (15 mins)

```typescript
// 1. Import in App.tsx
import './styles/smoothness.css';
import { PageTransition } from '@/components/common/PageTransition';
import { ScrollToTopButton } from '@/components/common/SmoothScroll';

// 2. Wrap pages
<PageTransition>
  {/* Your routes here */}
</PageTransition>

// 3. Add scroll button
<ScrollToTopButton />

// 4. Replace spinners with skeletons in loading states
// Done! 🎉
```

---

## 📞 Need More?

- Full guide: `SMOOTHNESS_IMPLEMENTATION_GUIDE.md`
- Component files: `src/components/common/`
- CSS utilities: `src/styles/smoothness.css`
- Helper functions: `src/utils/smoothnessUtils.ts`

---

**Created:** 2026-03-27
**Status:** Production Ready
**Time to Integrate:** ~5 hours
**Performance Impact:** Negligible
**User Experience Impact:** Significant ✨
