// src/core/network/apiClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

export default api;
