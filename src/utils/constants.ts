export const colors = {
  primary: '#00D4AA',           // Bright teal for CTAs and highlights
  primaryHover: '#00BF9A',      // Darker teal for hover states
  background: '#1a1f2e',        // Dark navy background
  surface: '#2a3142',           // Elevated surfaces (cards, modals)
  surfaceHover: '#323849',      // Hover state for interactive surfaces
  textPrimary: '#ffffff',       // Main text color
  textSecondary: '#9ca3af',     // Secondary text (descriptions, labels)
  textMuted: '#6b7280',         // Muted text (placeholders, disabled)
  border: '#374151',            // Borders and dividers
  success: '#10b981',           // For completed items
  error: '#ef4444',             // For delete actions
};

export const typography = {
  h1: { fontSize: 28, fontWeight: 'bold' as const, color: colors.textPrimary },
  h2: { fontSize: 24, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: 'normal' as const, color: colors.textPrimary },
  caption: { fontSize: 14, fontWeight: 'normal' as const, color: colors.textSecondary },
  muted: { fontSize: 12, fontWeight: 'normal' as const, color: colors.textMuted },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const CATEGORIES = [
  { id: 'produce', name: 'Produce', icon: 'leaf-outline', isCustom: false },
  { id: 'dairy', name: 'Dairy', icon: 'water-outline', isCustom: false },
  { id: 'meat', name: 'Meat & Seafood', icon: 'fish-outline', isCustom: false },
  { id: 'pantry', name: 'Pantry', icon: 'archive-outline', isCustom: false },
  { id: 'frozen', name: 'Frozen', icon: 'snow-outline', isCustom: false },
  { id: 'bakery', name: 'Bakery', icon: 'restaurant-outline', isCustom: false },
  { id: 'snacks', name: 'Snacks', icon: 'fast-food-outline', isCustom: false },
  { id: 'beverages', name: 'Beverages', icon: 'wine-outline', isCustom: false },
  { id: 'household', name: 'Household', icon: 'home-outline', isCustom: false },
  { id: 'personal', name: 'Personal Care', icon: 'medical-outline', isCustom: false },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', isCustom: false },
];