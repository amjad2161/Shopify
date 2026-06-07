import type {CatalogEnv} from '../types.ts';

const API_VERSION = '2025-01';

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{message: string}>;
};

export class ShopifyAdminClient {
  private endpoint: string;
  private token: string;

  constructor(env: CatalogEnv) {
    const domain = env.PUBLIC_STORE_DOMAIN?.trim();
    const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
    if (!domain || !token) {
      throw new Error(
        'Missing PUBLIC_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN for Admin API',
      );
    }
    const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.endpoint = `https://${host}/admin/api/${API_VERSION}/graphql.json`;
    this.token = token;
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token,
      },
      body: JSON.stringify({query, variables}),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Admin API HTTP ${response.status}: ${text.slice(0, 400)}`);
    }

    const json = (await response.json()) as GraphqlResponse<T>;
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join('; '));
    }
    if (!json.data) {
      throw new Error('Admin API returned empty data');
    }
    return json.data;
  }
}

export type CollectionInput = {
  handle: string;
  title: string;
  descriptionHtml: string;
  seo: {title: string; description: string};
};

const COLLECTION_BY_HANDLE = `#graphql
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
    }
  }
`;

const COLLECTION_CREATE = `#graphql
  mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COLLECTION_UPDATE = `#graphql
  mutation CollectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function ensureCollection(
  client: ShopifyAdminClient,
  input: CollectionInput,
  dryRun: boolean,
) {
  const existing = await client.query<{
    collectionByHandle: {id: string; handle: string; title: string} | null;
  }>(COLLECTION_BY_HANDLE, {handle: input.handle});

  if (existing.collectionByHandle) {
    if (dryRun) {
      return {action: 'skipped' as const, id: existing.collectionByHandle.id};
    }

    const updated = await client.query<{
      collectionUpdate: {
        collection: {id: string} | null;
        userErrors: Array<{message: string}>;
      };
    }>(COLLECTION_UPDATE, {
      input: {
        id: existing.collectionByHandle.id,
        title: input.title,
        descriptionHtml: input.descriptionHtml,
        seo: input.seo,
      },
    });

    const errors = updated.collectionUpdate.userErrors;
    if (errors.length) {
      throw new Error(errors.map((e) => e.message).join('; '));
    }

    return {action: 'updated' as const, id: existing.collectionByHandle.id};
  }

  if (dryRun) {
    return {action: 'created' as const, id: `dry-run-${input.handle}`};
  }

  const created = await client.query<{
    collectionCreate: {
      collection: {id: string} | null;
      userErrors: Array<{message: string}>;
    };
  }>(COLLECTION_CREATE, {
    input: {
      handle: input.handle,
      title: input.title,
      descriptionHtml: input.descriptionHtml,
      seo: input.seo,
    },
  });

  const errors = created.collectionCreate.userErrors;
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }

  const id = created.collectionCreate.collection?.id;
  if (!id) throw new Error(`collectionCreate returned no id for ${input.handle}`);

  return {action: 'created' as const, id};
}

const PRODUCT_BY_METAFIELD = `#graphql
  query ProductsBySourceId($query: String!) {
    products(first: 1, query: $query) {
      nodes {
        id
        handle
      }
    }
  }
`;

const PRODUCT_SET = `#graphql
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input, synchronous: true) {
      product {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type ProductUpsertInput = {
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status: 'ACTIVE' | 'DRAFT';
  metafields: Array<{
    namespace: string;
    key: string;
    type: string;
    value: string;
  }>;
  variants: Array<{
    sku: string;
    price: string;
    compareAtPrice?: string;
    inventoryQuantities?: Array<{
      locationId: string;
      quantity: number;
    }>;
  }>;
  media?: Array<{originalSource: string; mediaContentType: 'IMAGE'}>;
  collectionIds?: string[];
};

export async function findProductBySourceId(
  client: ShopifyAdminClient,
  platform: string,
  externalId: string,
) {
  const query = `metafield:lumen_dropship.source_platform:${platform} AND metafield:lumen_dropship.source_product_id:${externalId}`;
  const result = await client.query<{
    products: {nodes: Array<{id: string; handle: string}>};
  }>(PRODUCT_BY_METAFIELD, {query});
  return result.products.nodes[0] ?? null;
}

export async function upsertProduct(
  client: ShopifyAdminClient,
  input: ProductUpsertInput & {id?: string},
  dryRun: boolean,
) {
  if (dryRun) {
    return {action: input.id ? 'updated' : 'created', id: input.id ?? 'dry-run-product'};
  }

  const result = await client.query<{
    productSet: {
      product: {id: string; handle: string} | null;
      userErrors: Array<{message: string}>;
    };
  }>(PRODUCT_SET, {input});

  const errors = result.productSet.userErrors;
  if (errors.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }

  const product = result.productSet.product;
  if (!product) throw new Error('productSet returned no product');

  return {
    action: input.id ? 'updated' : 'created',
    id: product.id,
    handle: product.handle,
  };
}
