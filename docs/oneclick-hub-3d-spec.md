# OneClick Hub — מסמך אפיון חוויית 3D

## חזון

חנות **OneClick Hub** על Shopify Hydrogen (React Router + Vite) עם שכבת חוויה תלת-ממדית במסך מלא. המטרה: גילוי מוצרים קולנועי, ניווט חלק, ומעבר מהיר לעגלה — בלי לפגוע בביצועים בנייד.

> הערת אתיקה: מנגנוני המרה (דחיפות, מיקרו-אנימציות, הדגשת מוצרים) מיושמים בשקיפות ובהתאם לנתונים אמיתיים מהחנות — לא במניפולציות מטעות. הודעת "מלאי נמוך" מוצגת רק כאשר Shopify מדווח על 1–5 יחידות (`totalInventory`).

## ארכיטקטורה

| שכבה | טכנולוגיה | תפקיד |
|------|-----------|--------|
| מסחר | Shopify Storefront API | מוצרים, מחירים, עגלה, מלאי |
| אפליקציה | Hydrogen + React Router 7 | SSR, routing, loaders |
| מצב גלובלי | Zustand (`useSceneStore`) | scroll, מוצר פעיל, mobile / reduced-motion |
| תלת-ממד | Three.js + R3F + Drei | קנבס, תאורת סטודיו, אורבים, GLB |
| אנימציה | GSAP + ScrollTrigger | סנכרון גלילה ↔ סצנה, מעברי דפים |
| אנליטיקה | Hydrogen Analytics + web-vitals | אירועי 3D, Core Web Vitals |
| עיצוב | CSS + Tailwind | שכבת HTML שקופה מעל הקנבס |

## הפעלה

```bash
npm install --legacy-peer-deps

# ב-.env
PUBLIC_3D_EXPERIENCE=1
PUBLIC_BRAND_NAME=OneClick Hub   # אופציונלי

PUBLIC_3D_EXPERIENCE=1 npm run dev
```

כאשר `PUBLIC_3D_EXPERIENCE` מופעל, דף הבית מציג `ImmersiveHome` במקום הלייאאוט הקלאסי. ללא WebGL — נפילה אוטומטית ל-`ClassicHomepage`. שאר העמודים נשארים ללא שינוי.

## מבנה קבצים

```
app/
  components/
    experience/
      ImmersiveHome.tsx           # אורקסטרציה
      ExperienceOverlay.tsx       # UI שקוף + מלאי נמוך + רייל מוצרים
      ExperienceProductRail.tsx   # רייל תמונות ממוזערות
      ExperienceErrorBoundary.tsx # נפילה מ-WebGL/R3F
    home/ClassicHomepage.tsx      # fallback דו-ממדי
    product/
      ProductViewer3d.tsx           # PDP viewer
      ProductViewerCanvas.tsx
    scene/
      SceneCanvas.tsx
      StudioStage.tsx
      ProductOrb.tsx
      ProductModel.tsx
      ProductSceneItem.tsx
      CameraRig.tsx
  hooks/
    useGsapExperience.ts          # scrollRef + focusAtIndex
    useExperienceFocusAnimation.ts
    useDevice3dProfile.ts
    useWebGLSupport.ts
    useAnnouncementOffset.ts
    useExperienceAnalytics.ts
    useWebVitals.ts
    usePageTransition.ts
  lib/
    three/
      map-products.ts
      webgl.ts
      image-url.ts
      load-glb.ts
    experience-analytics.ts
    experience-scroll.ts            # scrollProgressForIndex, scrollRootToProgress
  stores/useSceneStore.ts
  styles/experience.css
e2e/immersive-home.spec.ts
```

## שפה חזותית

- רקע חם (`#f4efe8`), ערפל רך, תאורת סטודיו (ambient + directional + Environment preset)
- אורבים גיאומטריים מעוגלים (`RoundedBox`) עם טקסטורת תמונת מוצר (WebP 512px)
- מודלי GLB (Draco) כשקיימים ב-media או ב-metafield `custom.model_3d`
- צללים (`ContactShadows`) רק בדסקטופ — מבוטלים בנייד לביצועים

## אינטראקציה

1. גלילה מזיזה את המצלמה/סיבוב האורבים (דרך `scrollProgress` + `setFocus`)
2. **לחיצה בודדת** על אורב/מודל → `3d_orb_focus` + מיקוד + גלילה לסגמנט המוצר (`focusAtIndex`)
3. **לחיצה כפולה** על אורב/מודל → `3d_orb_click` + ניווט ל-PDP
4. **רייל מוצרים** (`ExperienceProductRail`) — קפיצה למוצר בגלילה; מוסתר כשיש מוצר יחיד
5. פאנל מוצר פעיל עם i18n (en/he/fr), רמז אינטראקציה, CTA ל-PDP + תווית מלאי נמוך אמיתית
6. `prefers-reduced-motion` מכבה אנימציות GSAP/Float אך שומר סנכרון גלילה (native scroll → `syncScrollToScene`) ומיקום מצלמה סטטי
7. announcement bar נעלם בעדינות אחרי תחילת גלילה (immersive בלבד)
8. PDP: `ProductViewer3d` עם OrbitControls כשיש GLB + WebGL

## ביצועים ואופטימיזציה

| אופטימיזציה | סטטוס |
|-------------|--------|
| Lazy load `SceneCanvas` / PDP canvas | ✅ |
| ClientOnly (ללא WebGL ב-SSR) | ✅ |
| DPR מוגבל בנייד | ✅ |
| מקסימום 8 אורבים | ✅ |
| צללים כבדים off בנייד (`Canvas shadows`, `ProductOrb`, `StudioStage`) | ✅ |
| Draco decoder (Google CDN) | ✅ |
| WebP pipeline לטקסטורות | ✅ |
| `three` ב-Vite SSR optimizeDeps | ✅ |
| WebGL fallback → ClassicHomepage | ✅ |
| Core Web Vitals (`web-vitals`) | ✅ |
| Preload GLB לפי `sceneProductsWithModels` | ✅ |

## אנליטיקה

אירועים מפורסמים דרך `publishExperienceEvent` → `custom_3d_experience`:

- `3d_orb_focus` — מיקוד על אורב/מודל (לחיצה בודדת)
- `3d_orb_click` — פתיחת PDP (לחיצה כפולה)
- `3d_scroll_depth` — דלי עומק גלילה (0–10)
- `3d_fallback` — נפילה ל-2D
- `3d_webgl_error` — שגיאת WebGL/R3F
- `3d_pdp_viewer_open` — פתיחת viewer ב-PDP
- `3d_page_transition` — מעבר דף GSAP

בנוסף: `custom_web_vitals` (CLS, INP, LCP, FCP, TTFB) עם תווית `3d` / `classic`.

## בדיקות

```bash
npm run test          # Vitest — מיפוי מוצרים, WebGL, GLB, אנליטיקה
npm run test:e2e      # Playwright — דף בית immersive / classic (דורש חנות חיה ב-.env)
npm run typecheck
npm run codegen       # אחרי שינויי GraphQL
```

## GraphQL — מודלים תלת-ממדיים

בדף הבית וב-PDP:

```graphql
totalInventory
media(first: 5) {
  nodes {
    __typename
    ... on Model3d {
      sources { url format mimeType }
    }
  }
}
model3dMetafield: metafield(namespace: "custom", key: "model_3d") {
  reference { ... on GenericFile { url } }
}
```

## CI — build עם חנות חיה (אופציונלי)

כשמוגדרים ב-GitHub repository secrets:

- `SESSION_SECRET`
- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`

ה-workflow `store-build` מריץ `npm run build` אחרי ה-pipeline האוטומטי. `store-e2e` מריץ Playwright (`npm run test:e2e`) עם אותם secrets. ללא secrets — השלבים מדולגים.

## המשך פיתוח אופציונלי

1. A/B מדידה: conversion rate immersive מול classic
2. LOD / instancing כשמעל 8 מוצרים בקטלוג featured
3. Service Worker cache ל-GLB דחוסים
4. Storybook לרכיבי experience
