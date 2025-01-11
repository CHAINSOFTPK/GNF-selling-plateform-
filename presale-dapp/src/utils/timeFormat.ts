export const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) {
        console.warn('formatTimeAgo called with undefined timestamp.');
        return 'Just now';
    }

    const date = new Date(timestamp); // Changed from ternary operator
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date received in formatTimeAgo: ${timestamp}`);
        return 'Just now';
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle future dates
    if (seconds < 0) {
        return 'Just now';
    }

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    let counter;
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        counter = Math.floor(seconds / secondsInUnit);
        if (counter > 0) {
            return `${counter} ${unit}${counter === 1 ? '' : 's'} ago`;
        }
    }

    return 'Just now';
};