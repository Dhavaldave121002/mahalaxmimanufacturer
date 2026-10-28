const fs = require('fs');
const file = 'src/components/admin/MobileAppManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Ensure Palette is imported from lucide-react
if (!content.includes('Palette,')) {
  content = content.replace("  Smartphone,", "  Smartphone,\n  Palette,");
}

// 2. Destructure customizationPricing and updateCustomizationPricingConfig from useApp
if (!content.includes('updateCustomizationPricingConfig')) {
  content = content.replace(
    'refreshOrders\n  } = useApp();',
    'refreshOrders,\n    customizationPricing,\n    updateCustomizationPricingConfig\n  } = useApp();'
  );
}

// 3. Update activeSubTab type
if (!content.includes("'customization'")) {
  content = content.replace(
    "'banners' | 'categories' | 'products' | 'orders' | 'notifications' | 'settings' | 'mysql'",
    "'banners' | 'categories' | 'products' | 'orders' | 'notifications' | 'settings' | 'mysql' | 'customization'"
  );
}

// 4. Add state and handlers
const stateCode = `  // Customization Pricing State
  const [customPricingForm, setCustomPricingForm] = useState<Record<string, number>>(() => ({
    'Only Logo': customizationPricing?.['Only Logo'] ?? 12,
    'Only Design': customizationPricing?.['Only Design'] ?? 22,
    'Design & Logo': customizationPricing?.['Design & Logo'] ?? 32,
    'Embroidery Branding': customizationPricing?.['Embroidery Branding'] ?? 42,
    'Custom Weave & GSM': customizationPricing?.['Custom Weave & GSM'] ?? 55,
    'Custom Size': customizationPricing?.['Custom Size'] ?? 20,
  }));
  const [savingCustomPricing, setSavingCustomPricing] = useState(false);
  const [customPricingMsg, setCustomPricingMsg] = useState('');

  useEffect(() => {
    if (customizationPricing) {
      setCustomPricingForm(prev => ({
        ...prev,
        ...customizationPricing,
      }));
    }
  }, [customizationPricing]);

  const handleSaveCustomPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCustomPricing(true);
    setCustomPricingMsg('');
    try {
      const res = await updateCustomizationPricingConfig(customPricingForm);
      if (res.success) {
        setCustomPricingMsg('✅ Customization pricing saved and synced across Website & Mobile App!');
        triggerSyncAlert('Customization fees updated & synced to Website and Mobile App.');
      } else {
        setCustomPricingMsg('❌ ' + res.message);
      }
    } catch (err: any) {
      setCustomPricingMsg('❌ Error: ' + err.message);
    } finally {
      setSavingCustomPricing(false);
    }
  };

  const handleResetCustomPricing = () => {
    setCustomPricingForm({
      'Only Logo': 12,
      'Only Design': 22,
      'Design & Logo': 32,
      'Embroidery Branding': 42,
      'Custom Weave & GSM': 55,
      'Custom Size': 20,
    });
  };
`;

if (!content.includes('handleSaveCustomPricing')) {
  const insertBefore = '  // MySQL Test Connection state';
  content = content.replace(insertBefore, stateCode + '\n' + insertBefore);
}

// 5. Add navigation tab button
const tabButton = `            <button
              onClick={() => setActiveSubTab('customization')}
              className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap \${
                activeSubTab === 'customization'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }\`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>🎨 Customization Pricing</span>
            </button>`;

if (!content.includes("setActiveSubTab('customization')")) {
  const targetTab = "onClick={() => setActiveSubTab('mysql')}";
  const fullTargetButton = content.substring(content.indexOf(targetTab) - 20, content.indexOf(targetTab) + 300);
  // Find where mysql button ends
  const mysqlEnd = content.indexOf('</button>', content.indexOf(targetTab)) + 9;
  content = content.slice(0, mysqlEnd) + '\n\n' + tabButton + content.slice(mysqlEnd);
}

// 6. Add Customization Pricing panel UI
const customizationUi = `          {/* SUB-TAB 8: Customization & Branding Pricing Manager */}
          {activeSubTab === 'customization' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-navy flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <span>Live Customization & Condition Pricing Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set add-on charges per piece for logo printing, embroidery, design artwork, and custom sizing. Changes reflect live on Website & Mobile App without requiring an app reinstall.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-black rounded-lg border border-purple-200">
                    Live Synced
                  </span>
                </div>
              </div>

              {customPricingMsg && (
                <div className={\`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 \${
                  customPricingMsg.startsWith('✅')
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }\`}>
                  <span>{customPricingMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveCustomPricing} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Only Logo Print */}
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 hover:border-purple-300 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-purple-600" />
                        Only Logo Print
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                        +₹{customPricingForm['Only Logo'] || 0}/pc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Single or multi-color screen / DTF brand logo transfer printing.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Charge:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customPricingForm['Only Logo'] ?? 12}
                          onChange={e => setCustomPricingForm({ ...customPricingForm, 'Only Logo': Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-7 pr-3 py-2 text-xs font-black text-navy border border-slate-300 rounded-lg focus:border-purple-600 outline-none bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">/ pc</span>
                    </div>
                  </div>

                  {/* 2. Only Design Pattern */}
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:border-indigo-300 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-indigo" />
                        Only Design Artwork
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">
                        +₹{customPricingForm['Only Design'] || 0}/pc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      All-over custom pattern print or bespoke artwork across the product.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Charge:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customPricingForm['Only Design'] ?? 22}
                          onChange={e => setCustomPricingForm({ ...customPricingForm, 'Only Design': Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-7 pr-3 py-2 text-xs font-black text-navy border border-slate-300 rounded-lg focus:border-indigo-600 outline-none bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">/ pc</span>
                    </div>
                  </div>

                  {/* 3. Design & Logo (Dual Upload) */}
                  <div className="p-4 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 hover:border-purple-400 transition space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Design & Logo (Dual Package)
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-600 text-white">
                        +₹{customPricingForm['Design & Logo'] || 0}/pc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dual condition: Full bespoke artwork print + official company logo placement.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Charge:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customPricingForm['Design & Logo'] ?? 32}
                          onChange={e => setCustomPricingForm({ ...customPricingForm, 'Design & Logo': Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-7 pr-3 py-2 text-xs font-black text-navy border border-purple-300 rounded-lg focus:border-purple-600 outline-none bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">/ pc</span>
                    </div>
                  </div>

                  {/* 4. Embroidery Branding */}
                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:border-amber-300 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Embroidery Branding
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        +₹{customPricingForm['Embroidery Branding'] || 0}/pc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      High-density computerized multi-head thread embroidery crest / badge.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Charge:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customPricingForm['Embroidery Branding'] ?? 42}
                          onChange={e => setCustomPricingForm({ ...customPricingForm, 'Embroidery Branding': Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-7 pr-3 py-2 text-xs font-black text-navy border border-slate-300 rounded-lg focus:border-amber-600 outline-none bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">/ pc</span>
                    </div>
                  </div>

                  {/* 5. Custom Weave & GSM */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:border-emerald-300 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        Custom Weave & GSM
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                        +₹{customPricingForm['Custom Weave & GSM'] || 0}/pc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tailored mill yarn count, fabric GSM weight & custom loom weave spec.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Charge:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customPricingForm['Custom Weave & GSM'] ?? 55}
                          onChange={e => setCustomPricingForm({ ...customPricingForm, 'Custom Weave & GSM': Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-7 pr-3 py-2 text-xs font-black text-navy border border-slate-300 rounded-lg focus:border-emerald-600 outline-none bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">/ pc</span>
                    </div>
                  </div>

                  {/* 6. Custom Cut Size & Dimensions */}
                  <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50/30 hover:border-amber-400 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-amber-700" />
                        Custom Cut Size & Dimensions
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-300 text-amber-950">
                        +₹{customPricingForm['Custom Size'] || 0}/pc
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Condition add-on applied when customer selects "Custom Dimensions" and provides custom sizing.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500">Charge:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={customPricingForm['Custom Size'] ?? 20}
                          onChange={e => setCustomPricingForm({ ...customPricingForm, 'Custom Size': Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full pl-7 pr-3 py-2 text-xs font-black text-navy border border-slate-300 rounded-lg focus:border-amber-600 outline-none bg-white"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-400">/ pc</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 gap-3">
                  <button
                    type="button"
                    onClick={handleResetCustomPricing}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="submit"
                    disabled={savingCustomPricing}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingCustomPricing ? 'Saving & Syncing...' : '💾 Save & Sync Customization Pricing'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
`;

if (!content.includes("activeSubTab === 'customization'")) {
  const insertAfterMysql = "            </div>\n          )}"; // end of activeSubTab === 'mysql'
  // Find where activeSubTab === 'mysql' closes
  const mysqlIndex = content.indexOf("activeSubTab === 'mysql'");
  const closeIndex = content.indexOf("            </div>\n          )}", mysqlIndex);
  if (closeIndex !== -1) {
    const endPos = closeIndex + "            </div>\n          )}".length;
    content = content.slice(0, endPos) + '\n\n' + customizationUi + content.slice(endPos);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched MobileAppManager.tsx with Customization Pricing tab');
