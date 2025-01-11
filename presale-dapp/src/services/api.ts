import { API_BASE_URL } from '../config/constants';

// API service functions
export const getApiStatus = async (): Promise<{ status: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking API status:', error);
        throw error;
    }
};

// Even if you don't have any functions to export yet, 
// add an empty export to ensure the file is treated as a module
export {};
