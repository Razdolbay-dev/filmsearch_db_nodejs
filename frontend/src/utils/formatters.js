// Утилиты для безопасного форматирования данных из API

export function formatVoteAverage(voteAverage) {
    if (voteAverage === undefined || voteAverage === null) return 'N/A';

    const num = parseFloat(voteAverage);
    if (isNaN(num)) return 'N/A';

    return num.toFixed(1);
}

export function formatYear(dateString) {
    if (!dateString) return 'N/A';
    if (typeof dateString !== 'string') return String(dateString);

    const match = dateString.match(/^\d{4}/);
    return match ? match[0] : 'N/A';
}

export function formatRuntime(minutes) {
    if (!minutes && minutes !== 0) return 'N/A';

    const mins = parseInt(minutes);
    if (isNaN(mins)) return 'N/A';

    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours === 0) return `${remainingMins} мин`;
    if (remainingMins === 0) return `${hours} ч`;
    return `${hours} ч ${remainingMins} мин`;
}

export function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'N/A';

    const num = parseInt(amount);
    if (isNaN(num)) return 'N/A';

    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

export function safeParseJSON(data, defaultValue = null) {
    if (!data) return defaultValue;

    try {
        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
        return defaultValue;
    }
}