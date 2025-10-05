export type DialogAppearance = 'info' | 'success' | 'error';

export interface DialogConfig {
  title: string;
  message: string;
  appearance?: DialogAppearance;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryVariant?: 'primary' | 'default' | 'danger';
  secondaryLabel?: string;
  onSecondary?: () => void;
}
