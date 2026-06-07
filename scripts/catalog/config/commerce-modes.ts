/**
 * E-commerce business models supported by the catalog automation stack.
 * Verticals can tag one or more modes; sourcing & pricing rules adapt per mode.
 */
export type CommerceModeId =
  | 'standard_ecommerce'
  | 'dropshipping'
  | 'arbitrage'
  | 'print_on_demand'
  | 'wholesale'
  | 'subscription'
  | 'marketplace'
  | 'b2b'
  | 'digital_goods'
  | 'flash_sales'
  | 'cross_border'
  | 'white_label'
  | 'affiliate'
  | 'preorder'
  | 'bundle_upsell';

export type CommerceMode = {
  id: CommerceModeId;
  label: {en: string; he: string};
  description: string;
  /** Prefer cheapest landed cost when multiple sources exist. */
  optimizeForCost: boolean;
  /** Typical margin floor (percent over cost). */
  defaultMarginPercent: number;
  fulfillmentMode: 'source_seller' | 'warehouse' | 'hybrid';
};

export const COMMERCE_MODES: CommerceMode[] = [
  {
    id: 'standard_ecommerce',
    label: {en: 'Standard E-commerce', he: 'מסחר אלקטרוני קלאסי'},
    description: 'Own inventory or 3PL — buy stock, store, ship.',
    optimizeForCost: false,
    defaultMarginPercent: 40,
    fulfillmentMode: 'warehouse',
  },
  {
    id: 'dropshipping',
    label: {en: 'Dropshipping', he: 'דרופשיפינג'},
    description: 'List supplier catalog; source seller fulfills to end customer.',
    optimizeForCost: true,
    defaultMarginPercent: 45,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'arbitrage',
    label: {en: 'Retail / Online Arbitrage', he: 'ארביטראז׳'},
    description: 'Buy low from marketplace A, sell higher on your store.',
    optimizeForCost: true,
    defaultMarginPercent: 25,
    fulfillmentMode: 'hybrid',
  },
  {
    id: 'print_on_demand',
    label: {en: 'Print on Demand', he: 'הדפסה לפי דרישה'},
    description: 'Custom apparel & merch produced after order.',
    optimizeForCost: true,
    defaultMarginPercent: 50,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'wholesale',
    label: {en: 'Wholesale / Bulk', he: 'סיטונאות'},
    description: 'Volume pricing, MOQ suppliers, B2B-style margins.',
    optimizeForCost: true,
    defaultMarginPercent: 20,
    fulfillmentMode: 'warehouse',
  },
  {
    id: 'subscription',
    label: {en: 'Subscription', he: 'מנויים'},
    description: 'Recurring boxes, replenishment, membership perks.',
    optimizeForCost: false,
    defaultMarginPercent: 35,
    fulfillmentMode: 'hybrid',
  },
  {
    id: 'marketplace',
    label: {en: 'Marketplace', he: 'מרקטפלייס'},
    description: 'Multi-vendor listings with commission model.',
    optimizeForCost: false,
    defaultMarginPercent: 15,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'b2b',
    label: {en: 'B2B', he: 'עסק לעסק'},
    description: 'Trade accounts, net terms, catalog pricing tiers.',
    optimizeForCost: true,
    defaultMarginPercent: 18,
    fulfillmentMode: 'warehouse',
  },
  {
    id: 'digital_goods',
    label: {en: 'Digital Goods', he: 'מוצרים דיגיטליים'},
    description: 'Downloads, licenses, SaaS add-ons — zero shipping.',
    optimizeForCost: false,
    defaultMarginPercent: 80,
    fulfillmentMode: 'warehouse',
  },
  {
    id: 'flash_sales',
    label: {en: 'Flash Sales', he: 'מבצעי בזק'},
    description: 'Time-boxed drops tied to trend velocity.',
    optimizeForCost: true,
    defaultMarginPercent: 55,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'cross_border',
    label: {en: 'Cross-border', he: 'סחר חוצה גבולות'},
    description: 'Source globally, sell in target country with localized pricing.',
    optimizeForCost: true,
    defaultMarginPercent: 42,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'white_label',
    label: {en: 'White Label', he: 'מותג פרטי'},
    description: 'Rebrand supplier SKUs under your store identity.',
    optimizeForCost: true,
    defaultMarginPercent: 60,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'affiliate',
    label: {en: 'Affiliate / Curated', he: 'אפיליאייט'},
    description: 'Curated catalog with outbound or hybrid fulfillment.',
    optimizeForCost: false,
    defaultMarginPercent: 30,
    fulfillmentMode: 'hybrid',
  },
  {
    id: 'preorder',
    label: {en: 'Pre-order / Crowdfund', he: 'הזמנה מראש'},
    description: 'Sell before stock lands — trend-capture launches.',
    optimizeForCost: true,
    defaultMarginPercent: 48,
    fulfillmentMode: 'source_seller',
  },
  {
    id: 'bundle_upsell',
    label: {en: 'Bundles & Upsells', he: 'חבילות ואפסייל'},
    description: 'Kits and AOV boosters assembled from cheapest sources.',
    optimizeForCost: true,
    defaultMarginPercent: 52,
    fulfillmentMode: 'hybrid',
  },
];

export function getCommerceMode(id: CommerceModeId) {
  return COMMERCE_MODES.find((m) => m.id === id);
}

export const ALL_COMMERCE_MODE_IDS = COMMERCE_MODES.map((m) => m.id);
