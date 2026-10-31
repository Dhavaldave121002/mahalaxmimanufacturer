const normalizeCity = (city: string) => city
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export const getDispatchLabel = (city: string | null | undefined, state: string | null | undefined) => {
  const destination = city?.trim();
  if (!destination) return 'Direct Mill Dispatch';

  const normalizedCity = normalizeCity(destination);
  if (normalizedCity === 'ahmedabad' || normalizedCity === 'ahmadabad') return 'Direct Ahmedabad Mill Dispatch';
  if (normalizedCity === 'surat') return 'Direct Surat Mill Dispatch';

  return `Direct Mill Dispatch to ${destination}${state ? `, ${state}` : ''}`;
};
