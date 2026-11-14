import { ShieldCheck, Truck } from 'lucide-react';
import { AUTHENTICITY_CHECK_TEXT, DELIVERY_ESTIMATE_TEXT } from '../../utils/deliveryDisplay';

export const DispatchAssurance = () => (
  <section
    aria-label="Dispatch and authenticity information"
    className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:text-center"
  >
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-navy sm:flex-col sm:justify-center sm:px-2 sm:py-3 sm:text-center">
      <Truck className="h-4 w-4 shrink-0 text-indigo sm:mb-1" aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="text-[11px] font-bold sm:text-xs">Delivery Estimate</h3>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-600 sm:text-[11px]">{DELIVERY_ESTIMATE_TEXT}</p>
      </div>
    </div>
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left text-emerald-900 sm:flex-col sm:justify-center sm:px-2 sm:py-3 sm:text-center">
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700 sm:mb-1" aria-hidden="true" />
      <div className="min-w-0">
        <h3 className="text-[11px] font-bold sm:text-xs">Authenticity Check</h3>
        <p className="mt-0.5 text-[10px] leading-snug text-emerald-800 sm:text-[11px]">{AUTHENTICITY_CHECK_TEXT}</p>
      </div>
    </div>
  </section>
);
