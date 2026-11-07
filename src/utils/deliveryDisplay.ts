export const getDeliveryEstimate = (city: string | null | undefined, today = new Date()) => {
  const isAhmedabad = /ahmedabad|ahmadabad/i.test(city || '');
  const minDays = isAhmedabad ? 2 : 5;
  const maxDays = isAhmedabad ? 3 : 7;
  const formatDate = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  return {
    minDays,
    maxDays,
    dateRange: `${formatDate(minDays)} - ${formatDate(maxDays)}`
  };
};

export const getDispatchLabel = () => 'Direct Ahmedabad Mill Dispatch';
