import {
  useFetcher,
  useNavigate,
  type FormProps,
  type Fetcher,
} from 'react-router';
import React, {useRef, useEffect} from 'react';
import type {PredictiveSearchReturn} from '~/lib/search';
import {useI18n} from '~/lib/i18n/I18nProvider';
import {useAside} from './Aside';

type SearchFormPredictiveChildren = (args: {
  fetchResults: (event: React.ChangeEvent<HTMLInputElement>) => void;
  goToSearch: () => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  fetcher: Fetcher<PredictiveSearchReturn>;
}) => React.ReactNode;

type SearchFormPredictiveProps = Omit<FormProps, 'children'> & {
  children: SearchFormPredictiveChildren | null;
};

/**
 * Search form component that sends search requests to the localized `/search` route.
 */
export function SearchFormPredictive({
  children,
  className = 'predictive-search-form',
  ...props
}: SearchFormPredictiveProps) {
  const {path} = useI18n();
  const searchEndpoint = path('/search');
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const aside = useAside();

  function resetInput(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (inputRef?.current?.value) {
      inputRef.current.blur();
    }
  }

  function goToSearch() {
    const term = inputRef?.current?.value;
    void navigate(searchEndpoint + (term ? `?q=${term}` : ''));
    aside.close();
  }

  function fetchResults(event: React.ChangeEvent<HTMLInputElement>) {
    void fetcher.submit(
      {q: event.target.value || '', limit: 5, predictive: true},
      {method: 'GET', action: searchEndpoint},
    );
  }

  useEffect(() => {
    inputRef?.current?.setAttribute('type', 'search');
  }, []);

  if (typeof children !== 'function') {
    return null;
  }

  return (
    <fetcher.Form {...props} className={className} onSubmit={resetInput}>
      {children({inputRef, fetcher, fetchResults, goToSearch})}
    </fetcher.Form>
  );
}
