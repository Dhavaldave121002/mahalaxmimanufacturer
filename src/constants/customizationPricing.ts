export interface CustomizationOptionInfo {
  charge: number;
  label: string;
  badge: string;
  desc: string;
  popular?: boolean;
}

export const CUSTOMIZATION_PRICING: Record<string, CustomizationOptionInfo> = {
  'No Customization': {
    charge: 0,
    label: 'Standard Pack',
    badge: 'Free (+₹0)',
    desc: 'Standard mill finish & bulk carton packaging without custom branding'
  },
  'Only Logo': {
    charge: 12,
    label: 'Only Logo Print',
    badge: '+₹12/pc',
    desc: 'Single/multi-color screen or digital transfer brand logo printing',
    popular: true
  },
  'Only Design': {
    charge: 22,
    label: 'Only Design',
    badge: '+₹22/pc',
    desc: 'All-over custom pattern print or bespoke artwork across the product'
  },
  'Design & Logo': {
    charge: 32,
    label: 'Design & Logo',
    badge: '+₹32/pc',
    desc: 'Complete all-over custom artwork print + official company logo placement',
    popular: true
  },
  'Embroidery Branding': {
    charge: 42,
    label: 'Embroidery Branding',
    badge: '+₹42/pc',
    desc: 'High-density multi-head computerized thread embroidery badge/crest'
  },
  'Custom Weave & GSM': {
    charge: 55,
    label: 'Custom Weave & GSM',
    badge: '+₹55/pc',
    desc: 'Tailored mill yarn count, fabric GSM weight & custom loom weave spec'
  }
};

export let CUSTOM_SIZE_ADDON_CHARGE = 20;

export function updateCustomizationPricing(pricing: Record<string, number>): void {
  if (!pricing) return;
  if (pricing['Only Logo'] !== undefined) {
    const val = Number(pricing['Only Logo']);
    CUSTOMIZATION_PRICING['Only Logo'].charge = val;
    CUSTOMIZATION_PRICING['Only Logo'].badge = `+₹${val}/pc`;
  }
  if (pricing['Only Design'] !== undefined) {
    const val = Number(pricing['Only Design']);
    CUSTOMIZATION_PRICING['Only Design'].charge = val;
    CUSTOMIZATION_PRICING['Only Design'].badge = `+₹${val}/pc`;
  }
  if (pricing['Design & Logo'] !== undefined) {
    const val = Number(pricing['Design & Logo']);
    CUSTOMIZATION_PRICING['Design & Logo'].charge = val;
    CUSTOMIZATION_PRICING['Design & Logo'].badge = `+₹${val}/pc`;
  }
  if (pricing['Embroidery Branding'] !== undefined) {
    const val = Number(pricing['Embroidery Branding']);
    CUSTOMIZATION_PRICING['Embroidery Branding'].charge = val;
    CUSTOMIZATION_PRICING['Embroidery Branding'].badge = `+₹${val}/pc`;
  }
  if (pricing['Custom Weave & GSM'] !== undefined) {
    const val = Number(pricing['Custom Weave & GSM']);
    CUSTOMIZATION_PRICING['Custom Weave & GSM'].charge = val;
    CUSTOMIZATION_PRICING['Custom Weave & GSM'].badge = `+₹${val}/pc`;
  }
  if (pricing['Custom Size'] !== undefined) {
    CUSTOM_SIZE_ADDON_CHARGE = Number(pricing['Custom Size']);
  }
}

export function getCustomizationCharge(type?: string): number {
  if (!type) return 0;
  return CUSTOMIZATION_PRICING[type]?.charge ?? 0;
}

export function getSizeCharge(selectedSize?: string): number {
  if (!selectedSize) return 0;
  const s = selectedSize.toLowerCase();
  if (s.includes('custom')) {
    return CUSTOM_SIZE_ADDON_CHARGE;
  }
  return 0;
}

export function getTotalCustomizationCharge(
  type?: string,
  selectedSize?: string
): { typeCharge: number; sizeCharge: number; totalCharge: number } {
  const typeCharge = getCustomizationCharge(type);
  const sizeCharge = getSizeCharge(selectedSize);
  return {
    typeCharge,
    sizeCharge,
    totalCharge: typeCharge + sizeCharge
  };
}
