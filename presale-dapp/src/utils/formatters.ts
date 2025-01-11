export const formatNumber = (num: number | string): string => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return value.toFixed(4).replace(/\.?0+$/, '');
};
