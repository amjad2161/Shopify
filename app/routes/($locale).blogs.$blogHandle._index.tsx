import {Link, useLoaderData, type MetaDescriptor} from 'react-router';
import type {Route} from './+types/($locale).blogs.$blogHandle._index';
import {Image, getPaginationVariables} from '@shopify/hydrogen';
import type {ArticleItemFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {resolveBrandUrl} from '~/lib/brand';
import {
  breadcrumbJsonLd,
  buildCanonicalUrl,
  canonicalLinkMeta,
  hreflangAlternateMetas,
} from '~/lib/seo-meta';

import {
  findLocaleByPath,
  getDefaultLocale,
  brandNameFromMatches,
  localizedPageTitle,
  translate,
  useI18n,
} from '~/lib/i18n';

export const meta: Route.MetaFunction = ({data, params, matches, location}) => {
  const brandName = brandNameFromMatches(matches);
  const locale = findLocaleByPath(params.locale) ?? getDefaultLocale();
  const page =
    data?.blog.title ?? translate(locale.uiLocale, 'meta.journal');
  const title = localizedPageTitle(page, locale.uiLocale, brandName);
  const handle = data?.blog?.handle ?? params.blogHandle;
  const pathname = handle ? `/blogs/${handle}` : location.pathname;
  const canonicalUrl = buildCanonicalUrl({
    brandUrl: data?.brandUrl,
    localePath: locale.path,
    pathname,
  });
  const description =
    data?.blog?.seo?.description?.trim() ||
    translate(locale.uiLocale, 'brand.description');

  const tags: MetaDescriptor[] = [
    {title},
    {name: 'description', content: description},
    canonicalLinkMeta(canonicalUrl),
    ...hreflangAlternateMetas(data?.brandUrl, location.pathname),
  ];

  return tags;
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  return {blog, brandUrl: resolveBrandUrl(context.env)};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Blog() {
  const {blog, brandUrl} = useLoaderData<typeof loader>();
  const {articles} = blog;
  const {path, t} = useI18n();
  const blogPath = path(`/blogs/${blog.handle}`);
  const blogUrl = brandUrl ? `${brandUrl}${blogPath}` : blogPath;
  const homeUrl = brandUrl ? `${brandUrl}${path('/')}` : path('/');

  return (
    <div className="blog">
      <h1>{blog.title}</h1>
      <div className="blog-grid">
        <PaginatedResourceSection<ArticleItemFragment> connection={articles}>
          {({node: article, index}) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              {name: t('nav.home'), url: homeUrl},
              {name: t('blogs.heading'), url: brandUrl ? `${brandUrl}${path('/blogs')}` : path('/blogs')},
              {name: blog.title, url: blogUrl},
            ]),
          ),
        }}
      />
    </div>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  const {path, locale} = useI18n();
  const publishedAt = new Intl.DateTimeFormat(locale.intlTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt!));
  return (
    <div className="blog-article" key={article.id}>
      <Link
        to={path(`/blogs/${article.blog.handle}/${article.handle}`)}
      >
        {article.image && (
          <div className="blog-article-image">
            <Image
              alt={article.image.altText || article.title}
              aspectRatio="3/2"
              data={article.image}
              loading={loading}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}
        <h3>{article.title}</h3>
        <small>{publishedAt}</small>
      </Link>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
  }
` as const;
