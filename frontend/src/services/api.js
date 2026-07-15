import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message =
            error.response?.data?.message || error.message || 'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

export const memberService = {
    getAll: () => api.get('/members'),
    add: (name) => api.post('/members', { name }),
    remove: (id) => api.delete(`/members/${id}`),
};

export const expenseService = {
    getAll: () => api.get('/expenses'),
    add: (payload) => api.post('/expenses', payload),
    remove: (id) => api.delete(`/expenses/${id}`),
};

export const balanceService = {
    get: () => api.get('/balances'),
};
