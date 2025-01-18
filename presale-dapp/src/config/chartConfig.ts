import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Theme colors
const colors = {
    primary: '#0194FC',
    primaryLight: '#079e92',
    primaryDark: '#068c82',
    gridColor: 'rgba(0, 0, 0, 0.1)',
    textColor: '#6B7280'
};

// Chart options configuration
export const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: colors.gridColor,
                drawBorder: false
            },
            ticks: {
                color: colors.textColor,
                font: {
                    size: 12
                },
                padding: 8
            },
            border: {
                display: false
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: colors.textColor,
                font: {
                    size: 12
                },
                padding: 8
            },
            border: {
                display: false
            }
        }
    },
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#111827',
            bodyColor: '#374151',
            borderColor: colors.primary,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
                size: 14,
                weight: 'bold' as const // Fixed: specify 'bold' as const
            },
            bodyFont: {
                size: 13
            },
            displayColors: true,
            usePointStyle: true
        }
    },
    animation: {
        duration: 1000,
        easing: 'easeInOutQuad' as const
    },
    elements: {
        bar: {
            backgroundColor: colors.primary,
            borderRadius: 6,
            borderSkipped: false as const
        }
    }
} as const; // Added as const to entire config

// Bar chart specific configuration
export const barChartOptions = {
    ...chartOptions,
    plugins: {
        ...chartOptions.plugins,
        legend: {
            display: true,
            position: 'bottom' as const,
            labels: {
                color: colors.textColor,
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12,
                    weight: 'normal' as const
                }
            }
        }
    }
};

// Helper function to get chart colors
export const getChartColors = (count: number) => {
    const baseColors = [colors.primary, colors.primaryLight, colors.primaryDark];
    return baseColors.slice(0, count);
};
