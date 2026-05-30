const hostname = window.location.hostname;
let backendUrl = '';

if (hostname.includes('github.io')) {
    backendUrl = 'https://my-media-tracker-api.onrender.com';
} else if (hostname === '127.0.0.1' || hostname === 'localhost') {
    backendUrl = 'http://127.0.0.1:8080/api';
} else {
    backendUrl = '/api';
}

export const API_BASE_URL = backendUrl;