import React from 'react';

type DesktopColumnCount = 2 | 3;
type MobileColumnCount = 1 | 2;

interface ProductGridLayoutControlsProps {
  desktopColumns: DesktopColumnCount;
  mobileColumns: MobileColumnCount;
  onDesktopColumnsChange: (columns: DesktopColumnCount) => void;
  onMobileColumnsChange: (columns: MobileColumnCount) => void;
}

const ColumnIcon: React.FC<{ count: number }> = ({ count }) => (
  <span className="flex h-4 items-center justify-center gap-[2px]" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <span key={index} className="h-3.5 w-[2px] rounded-full bg-current" />
    ))}
  </span>
);

const buttonClassName = (selected: boolean) =>
  `flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 transition ${
    selected
      ? 'border-indigo bg-indigo text-white shadow-sm'
      : 'border-slate-200 bg-white text-slate-500 hover:border-indigo/40 hover:text-indigo'
  }`;

export const ProductGridLayoutControls: React.FC<ProductGridLayoutControlsProps> = ({
  desktopColumns,
  mobileColumns,
  onDesktopColumnsChange,
  onMobileColumnsChange
}) => (
  <div className="flex items-center gap-2" aria-label="Product grid layout">
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 md:hidden" role="group" aria-label="Mobile grid columns">
      {([1, 2] as const).map(columns => (
        <button
          key={columns}
          type="button"
          onClick={() => onMobileColumnsChange(columns)}
          aria-label={`Show ${columns} ${columns === 1 ? 'column' : 'columns'} on mobile`}
          aria-pressed={mobileColumns === columns}
          className={buttonClassName(mobileColumns === columns)}
        >
          <ColumnIcon count={columns} />
        </button>
      ))}
    </div>
    <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 md:flex" role="group" aria-label="Desktop grid columns">
      {([2, 3] as const).map(columns => (
        <button
          key={columns}
          type="button"
          onClick={() => onDesktopColumnsChange(columns)}
          aria-label={`Show ${columns} columns on desktop`}
          aria-pressed={desktopColumns === columns}
          className={buttonClassName(desktopColumns === columns)}
        >
          <ColumnIcon count={columns} />
        </button>
      ))}
    </div>
  </div>
);
