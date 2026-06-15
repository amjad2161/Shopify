import {useLoaderData, type MetaDescriptor} from 'react-router';
import type {Route} from './+types/($locale).blogs.$blogHandle.$articleHandle';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {sanitizeProductHtml} from '~/lib/sanitize-html';
import {resolveBrandUrl} from '~/lib/brand';
import {
  articleJsonLd,
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
    data?.article.title ?? translate(locale.uiLocale, 'meta.article');
  const title = localizedPageTitle(page, locale.uiLocale, brandName);
  const blogHandle = params.blogHandle;
  const articleHandle = data?.article?.handle ?? params.articleHandle;
  const pathname =
    blogHandle && articleHandle
      ? `/blogs/${blogHandle}/${articleHandle}`
      : location.pathname;
  const canonicalUrl = buildCanonicalUrl({
    brandUrl: data?.brandUrl,
    localePath: locale.path,
    pathname,
  });
  const description =
    data?.article?.seo?.description?.trim() ||
    translate(locale.uiLocale, 'brand.description');

  const tags: MetaDescriptor[] = [
    {title},
    {name: 'description', content: description},
    canonicalLinkMeta(canonicalUrl),
    ...hreflangAlternateMetas(data?.brandUrl, location.pathname),
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:type', content: 'article'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];

  if (data?.article?.image?.url) {
    tags.push({property: 'og:image', content: data.article.image.url});
    tags.push({name: 'twitter:image', content: data.article.image.url});
  }

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
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {
    article,
    blogHandle,
    brandUrl: resolveBrandUrl(context.env),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article, blogHandle, brandUrl} = useLoaderData<typeof loader>();
  const {locale, path, t} = useI18n();
  const {title, image, contentHtml, author} = article;

  const publishedDate = new Intl.DateTimeFormat(locale.intlTag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt));

  const articlePath = path(`/blogs/${blogHandle}/${article.handle}`);
  const articleUrl = brandUrl ? `${brandUrl}${articlePath}` : articlePath;
  const homeUrl = brandUrl ? `${brandUrl}${path('/')}` : path('/');

  return (
    <div className="article">
      <h1>
        {title}
        <div>
          <time dateTime={article.publishedAt}>{publishedDate}</time> &middot;{' '}
          <address>{author?.name}</address>
        </div>
      </h1>

      {image && <Image data={image} sizes="90vw" loading="eager" />}
      <div
        dangerouslySetInnerHTML={{__html: sanitizeProductHtml(contentHtml)}}
        className="article"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            articleJsonLd(
              {
                title: article.title,
                description: article.seo?.description,
                publishedAt: article.publishedAt,
                authorName: author?.name,
                imageUrl: image?.url,
              },
              articleUrl,
            ),
            breadcrumbJsonLd([
              {name: t('nav.home'), url: homeUrl},
              {name: t('blogs.heading'), url: brandUrl ? `${brandUrl}${path('/blogs')}` : path('/blogs')},
              {name: article.title, url: articleUrl},
            ]),
          ]),
        }}
      />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
