import {Link} from 'react-router';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';
import {useI18n} from '~/lib/i18n/I18nProvider';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  const {path, t} = useI18n();
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>{t('search.articles')}</h2>
      <div>
        {articles?.nodes?.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: path(`/blogs/${article.handle}`),
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                {article.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  const {path, t} = useI18n();
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>{t('search.pages')}</h2>
      <div>
        {pages?.nodes?.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: path(`/pages/${page.handle}`),
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <div className="search-results-item" key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                {page.title}
              </Link>
            </div>
          );
        })}
      </div>
      <br />
    </div>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  const {path, t} = useI18n();
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <h2>{t('search.products')}</h2>
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink}) => {
          const ItemsMarkup = nodes.map((product) => {
            const productUrl = urlWithTrackingParams({
              baseUrl: path(`/products/${product.handle}`),
              trackingParams: product.trackingParameters,
              term,
            });

            const price = product?.selectedOrFirstAvailableVariant?.price;
            const image = product?.selectedOrFirstAvailableVariant?.image;

            return (
              <div className="search-results-item" key={product.id}>
                <Link prefetch="intent" to={productUrl}>
                  {image && (
                    <Image data={image} alt={product.title} width={50} />
                  )}
                  <div>
                    <p>{product.title}</p>
                    <small>{price && <Money data={price} />}</small>
                  </div>
                </Link>
              </div>
            );
          });

          return (
            <div>
              <div>
                <PreviousLink>
                  {isLoading ? (
                    t('paginated.loading')
                  ) : (
                    <span>↑ {t('paginated.loadPrevious')}</span>
                  )}
                </PreviousLink>
              </div>
              <div>
                {ItemsMarkup}
                <br />
              </div>
              <div>
                <NextLink>
                  {isLoading ? (
                    t('paginated.loading')
                  ) : (
                    <span>{t('paginated.loadMore')} ↓</span>
                  )}
                </NextLink>
              </div>
            </div>
          );
        }}
      </Pagination>
      <br />
    </div>
  );
}

function SearchResultsEmpty() {
  const {t} = useI18n();
  return <p>{t('search.noResultsAlt')}</p>;
}
