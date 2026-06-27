// src/core/utils/currency.ts

/**
 * Format a number as Bangladeshi Taka.
 * Uses the Intl API — no third-party deps needed.
 */
export function formatTaka(amount: number): string {
    try {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            currencyDisplay: 'symbol',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `৳${amount.toLocaleString()}`;
    }
}

export function formatCompact(amount: number): string {
    if (amount >= 1_000_000) return `৳${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `৳${(amount / 1_000).toFixed(1)}K`;
    return `৳${amount.toFixed(0)}`;
}
