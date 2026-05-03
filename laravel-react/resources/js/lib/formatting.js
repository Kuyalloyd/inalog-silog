const phpCurrencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

const longDateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

export function formatCurrency(amount) {
    return phpCurrencyFormatter.format(Number(amount) || 0);
}

export function formatDateTime(value) {
    if (!value) {
        return 'Ngayon lang';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Ngayon lang';
    }

    return longDateTimeFormatter.format(parsedDate);
}

export function formatShortDate(value) {
    if (!value) {
        return 'Walang petsa';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Walang petsa';
    }

    return shortDateFormatter.format(parsedDate);
}

export function getFirstName(value) {
    if (!value || typeof value !== 'string') {
        return 'Bisita';
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return 'Bisita';
    }

    const source = trimmedValue.includes('@') ? trimmedValue.split('@')[0] : trimmedValue;
    const [firstName] = source.split(/\s+/);

    return firstName || 'Bisita';
}
