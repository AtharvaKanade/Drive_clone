import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class Api {
  client = axios.create({ baseURL: BASE_URL });

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  clearToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

export const api = new Api();


