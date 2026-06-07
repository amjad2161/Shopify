# OneClick Hub — מסמך אפיון חוויית 3D

## חזון

חנות **OneClick Hub** על Shopify Hydrogen (React Router + Vite) עם שכבת חוויה תלת-ממדית במסך מלא. המטרה: גילוי מוצרים קולנועי, ניווט חלק, ומעבר מהיר לעגלה — בלי לפגוע בביצועים בנייד.

> הערת אתיקה: מנגנוני המרה (דחיפות, מיקרו-אנימציות, הדגשת מוצרים) מיושמים בשקיפות ובהתאם לנתונים אמיתיים מהחנות — לא במניפולציות מטעות.

## ארכיטקטורה

| שכבה | טכנולוגיה | תפקיד |
|------|-----------|--------|
| מסחר | Shopify Storefront API | מוצרים, מחירים, עגלה |
| אפליקציה | Hydrogen + React Router 7 | SSR, routing, loaders |
| מצב גלובלי | Zustand (`useSceneStore`) | scroll, מוצר פעיל, mobile / reduced-motion |
| תלת-ממד | Three.js + R3F + Drei | קנבס, תאורת סטודיו, אורבים |
| אנימציה | GSAP + ScrollTrigger | סנכרון גלילה ↔ סצנה |
| עיצוב | CSS + Tailwind | שכבת HTML שקופה מעל הקנבס |

## הפעלה

```bash
# ב-.env
PUBLIC_3D_EXPERIENCE=1
PUBLIC_BRAND_NAME=OneClick Hub   # אופציונלי
```

כאשר `PUBLIC_3D_EXPERIENCE` מופעל, דף הבית מציג `ImmersiveHome` במקום הלייאאוט הקלאסי. שאר העמודים נשארים ללא שינוי.

## מבנה קבצים

```
app/
  components/
    experience/ImmersiveHome.tsx    # אורקסטרציה
    experience/ExperienceOverlay.tsx # UI שקוף
    scene/SceneCanvas.tsx           # Canvas R3F
    scene/StudioStage.tsx           # תאורה Pixar-style
    scene/ProductOrb.tsx            # אורב לחיץ לכל מוצר
  hooks/useGsapExperience.ts
  hooks/useDevice3dProfile.ts
  lib/three/map-products.ts
  stores/useSceneStore.ts
  styles/experience.css
```

## שפה חזותית

- רקע חם (`#f4efe8`), ערפל רך, תאורת סטודיו (ambient + directional + Environment preset)
- אורבים גיאומטריים מעוגלים (`RoundedBox`) עם טקסטורת תמונת מוצר
- צללים (`ContactShadows`) רק בדסקטופ — מבוטלים בנייד לביצועים

## אינטראקציה

1. גלילה מזיזה את המצלמה/סיבוב האורבים (דרך `scrollProgress`)
2. לחיצה על אורב → ניווט ל-PDP
3. פאנל מוצר פעיל בעברית/אנגלית (i18n קיים)
4. `prefers-reduced-motion` מכבה אנימציות GSAP ו-Float

## ביצועים (נוכחי + המשך)

| אופטימיזציה | סטטוס |
|-------------|--------|
| Lazy load `SceneCanvas` | ✅ |
| ClientOnly (ללא WebGL ב-SSR) | ✅ |
| DPR מוגבל בנייד | ✅ |
| מקסימום 8 אורבים | ✅ |
| צללים כבדים off בנייד | ✅ |
| Draco / GLB ממטאפילד | 🔜 |
| WebP pipeline | 🔜 (תמונות Shopify כבר ממוטבות) |

## המשך פיתוח מומלץ

1. מודלי GLB per-product (Draco) מ-metafield `custom.model_3d`
2. תצוגת 3D ב-PDP
3. Header שקוף מלא + הסתרת announcement בגלילה
4. Preload Draco decoder ב-Vite
5. מדידת Core Web Vitals עם/בלי 3D
