import type {CatalogEnv, PromotionRecommendation, ScoredProduct} from '../types.ts';
import {rankScoredProducts} from './product-scorer.ts';

export function planPromotions(
  env: CatalogEnv,
  products: ScoredProduct[],
): PromotionRecommendation[] {
  const ranked = rankScoredProducts(products);
  const recommendations: PromotionRecommendation[] = [];

  for (const product of ranked) {
    const {composite, trend, margin} = product.scores;
    const verticalRestricted = product.tags.includes('age-18-plus');

    if (composite >= 80 && trend >= 70 && !verticalRestricted) {
      recommendations.push({
        product,
        action: 'feature',
        reason: 'High composite + trend velocity — feature on homepage',
        priority: composite,
      });
    } else if (composite >= 72 && margin >= 50) {
      recommendations.push({
        product,
        action: 'boost_ad',
        reason: 'Strong margin + demand — candidate for paid push',
        priority: composite - 5,
      });
    } else if (composite >= 60 && !verticalRestricted) {
      recommendations.push({
        product,
        action: 'publish',
        reason: 'Meets import threshold — publish to catalog',
        priority: composite - 10,
      });
    } else if (verticalRestricted) {
      recommendations.push({
        product,
        action: 'hold_draft',
        reason: 'Age-restricted — keep draft until compliance review',
        priority: 20,
      });
    }
  }

  const topFeatured = env.FEATURED_COLLECTION_HANDLES?.split(',')
    .map((h) => h.trim())
    .filter(Boolean);

  if (topFeatured?.length) {
    for (const rec of recommendations.filter((r) => r.action === 'feature')) {
      rec.reason += ` · suggest collections: ${topFeatured.slice(0, 3).join(', ')}`;
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

export function formatPromotionSummary(recs: PromotionRecommendation[]) {
  const counts = {
    feature: recs.filter((r) => r.action === 'feature').length,
    boost_ad: recs.filter((r) => r.action === 'boost_ad').length,
    publish: recs.filter((r) => r.action === 'publish').length,
    hold_draft: recs.filter((r) => r.action === 'hold_draft').length,
  };

  const lines = [
    `Promotion plan: ${recs.length} recommendations`,
    `  feature: ${counts.feature} · boost_ad: ${counts.boost_ad} · publish: ${counts.publish} · hold_draft: ${counts.hold_draft}`,
  ];

  for (const rec of recs.slice(0, 8)) {
    lines.push(
      `  [${rec.action}] ${rec.product.title.slice(0, 48)} (score ${rec.product.scores.composite})`,
    );
  }

  return lines.join('\n');
}
