type DesktopColumnCount = 2 | 3;
type MobileColumnCount = 1 | 2;

export const getProductGridColumnsClassName = (
  mobileColumns: MobileColumnCount,
  desktopColumns: DesktopColumnCount
) => {
  const classes = {
    '1-2': 'grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2',
    '1-3': 'grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3',
    '2-2': 'grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2',
    '2-3': 'grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3'
  };

  return classes[`${mobileColumns}-${desktopColumns}` as keyof typeof classes];
};
