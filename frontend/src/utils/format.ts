import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(d, 'dd-MM-yyyy');
  } catch (e) {
    return String(dateStr);
  }
}

export function maskAccountNumber(accNo?: string): string {
  if (!accNo) return '';
  const clean = accNo.trim();
  if (clean.length <= 4) return clean;
  return `•••• ${clean.slice(-4)}`;
}
