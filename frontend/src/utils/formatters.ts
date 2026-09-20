export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getStatusInfo(status: string): {
  label: string;
  labelHi: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconName: 'check-circle' | 'alert-triangle' | 'clock' | 'circle';
} {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        labelHi: 'चुकता',
        colorClass: 'text-emerald-700',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        iconName: 'check-circle'
      };
    case 'overdue':
      return {
        label: 'Overdue',
        labelHi: 'तारीख निकल गई',
        colorClass: 'text-rose-700',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
        iconName: 'alert-triangle'
      };
    case 'due_soon':
      return {
        label: 'Due Soon',
        labelHi: 'जल्द देय',
        colorClass: 'text-amber-700',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        iconName: 'clock'
      };
    default:
      return {
        label: 'Active',
        labelHi: 'सक्रिय',
        colorClass: 'text-teal-700',
        bgClass: 'bg-teal-50',
        borderClass: 'border-teal-200',
        iconName: 'circle'
      };
  }
}

export function getReliabilityInfo(score: number, tier: string): {
  badgeColor: string;
  dotColor: string;
} {
  if (score >= 80 || tier === 'High') {
    return {
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotColor: 'bg-emerald-500'
    };
  }
  if (score >= 50 || tier === 'Medium') {
    return {
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-500'
    };
  }
  return {
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    dotColor: 'bg-rose-500'
  };
}
