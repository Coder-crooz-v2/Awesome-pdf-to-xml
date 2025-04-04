import axios from 'axios';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === 'development' ? 'http://localhost:8000/api/v1' : 'https://awesome-pdf-to-xml.onrender.com/api/v1',
    withCredentials: true,
});