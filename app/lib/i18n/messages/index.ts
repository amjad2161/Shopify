import type {UiLocale} from '../config';
import {en, type MessageKey} from './en';
import {fr} from './fr';
import {he} from './he';

const catalogs: Record<UiLocale, Record<MessageKey, string>> = {
  en,
  fr,
  he,
};

export type {MessageKey};

export function getMessages(uiLocale: UiLocale) {
  return catalogs[uiLocale] ?? en;
}

export function translate(
  uiLocale: UiLocale,
  key: MessageKey,
  vars?: Record<string, string | number>,
) {
  const template = getMessages(uiLocale)[key] ?? en[key];
  if (!vars) return template;

  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
