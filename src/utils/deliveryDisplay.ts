export const DELIVERY_MIN_WORKING_DAYS = 5;
export const DELIVERY_MAX_WORKING_DAYS = 7;
export const DELIVERY_ESTIMATE_TEXT = `Estimated delivery in ${DELIVERY_MIN_WORKING_DAYS}–${DELIVERY_MAX_WORKING_DAYS} working days.`;
export const AUTHENTICITY_CHECK_TEXT = 'Authenticity checked before shipping.';

export const getDeliveryEstimate = (_city?: string | null, today = new Date()) => {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const addWorkingDays = (workingDays: number) => {
    const date = new Date(start);
    let remainingDays = workingDays;
    while (remainingDays > 0) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) remainingDays--;
    }
    return date;
  };
  const earliestArrival = addWorkingDays(DELIVERY_MIN_WORKING_DAYS);
  const latestArrival = addWorkingDays(DELIVERY_MAX_WORKING_DAYS);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date);

  return {
    minWorkingDays: DELIVERY_MIN_WORKING_DAYS,
    maxWorkingDays: DELIVERY_MAX_WORKING_DAYS,
    dateRange: `${formatDate(earliestArrival)} - ${formatDate(latestArrival)}`,
    latestDeliveryDate: latestArrival
  };
};

export const getDispatchLabel = () => 'Direct Ahmedabad Mill Dispatch';
