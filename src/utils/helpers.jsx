import { useTranslation } from 'react-i18next';

// Build the canonical URL for a lesson based on its section.
export const lessonUrl = (lesson) => {
  const sectionId = lesson?.sectionId || 'sections';
  return `/section/${sectionId}/lesson/${lesson.id}`;
};

// Hook returning a pick() helper that returns the localized value of a field
// (field_ar / field_en) based on the active i18n language.
export const useLocalized = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith('ar');

  const pick = (obj, field) => {
    if (!obj) return '';
    const ar = obj[`${field}_ar`];
    const en = obj[`${field}_en`];
    return isAr ? (ar || en || '') : (en || ar || '');
  };

  return { isAr, pick };
};

// Wrap occurrences of `query` in `text` with <mark> for search highlighting.
export const highlight = (text, query) => {
  if (!text) return text;
  const q = (query || '').trim();
  if (!q) return text;

  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  const parts = [];
  let index = 0;
  let foundAt = lower.indexOf(qLower);

  while (foundAt !== -1) {
    if (foundAt > index) parts.push(text.slice(index, foundAt));
    parts.push(<mark key={parts.length} className="bg-gray-200 text-black px-0.5 rounded">{text.slice(foundAt, foundAt + q.length)}</mark>);
    index = foundAt + q.length;
    foundAt = lower.indexOf(qLower, index);
  }

  if (index < text.length) parts.push(text.slice(index));
  return parts.length ? parts : text;
};
