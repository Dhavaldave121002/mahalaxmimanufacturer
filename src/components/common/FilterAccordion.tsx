import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface FilterAccordionProps {
  title: string;
  defaultOpen?: boolean;
  summaryValue?: string;
  children: React.ReactNode;
}

export const FilterAccordion: React.FC<FilterAccordionProps> = ({
  title,
  defaultOpen = false,
  summaryValue,
  children
}) => (
  <details open={defaultOpen} className="group border-b border-slate-100 pb-3 last:border-b-0">
    <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">
      <span className="min-w-0 flex-1">{title}</span>
      {summaryValue && (
        <span className="max-w-[52%] truncate text-right text-xs font-medium text-indigo">{summaryValue}</span>
      )}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
        <Plus className="h-3.5 w-3.5 group-open:hidden" aria-hidden="true" />
        <Minus className="hidden h-3.5 w-3.5 group-open:block" aria-hidden="true" />
      </span>
    </summary>
    <div className="min-w-0 pt-3">{children}</div>
  </details>
);
