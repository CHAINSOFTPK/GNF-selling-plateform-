import { API_BASE_URL } from '../config/constants';

export const transferGNF = async (to: string, amount: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, amount })
        });
        const data = await response.json();
        if (data.status === 'error') {
            throw new Error(data.message);
        }
        return data;
    } catch (error) {
        console.error('Error in transferGNF:', error);
        throw error;
    }
};
