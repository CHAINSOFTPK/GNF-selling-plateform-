export const validateAmount = (amount: string, selectedToken?: string): boolean => {
    // Allow empty input, single dot, and "0."
    if (amount === '' || amount === '.' || amount === '0.') return false;
    
    // Validate numeric input with decimals
    const regex = /^\d*\.?\d*$/;
    if (!regex.test(amount)) return false;
    
    const numericValue = parseFloat(amount);
    return !isNaN(numericValue) && numericValue > 0;
};

export const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
};
