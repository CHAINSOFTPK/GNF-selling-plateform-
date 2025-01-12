export const validateAmount = (amount: string, tokenSymbol: string): boolean => {
    const numericAmount = safeParseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return false;
    return true;
};

export const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
};
