// src/lib/api.js
import axios from 'axios';
import Cookies from 'js-cookie';

// URL da API de Produção (a mesma que você subiu)
const BASE_URL = 'https://geral-ordengoapi.r954jc.easypanel.host/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Adiciona o Token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    // O garçom também recebe um token JWT ao fazer login com PIN
    // O nome do cookie deve ser consistente com o que definimos no login
    const token = Cookies.get('ordengo_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Trata erros globais (ex: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Se der erro de autenticação, limpa o token e redireciona para login
      Cookies.remove('ordengo_token');
      Cookies.remove('ordengo_user');
      
      // Redirecionamento seguro (apenas se estiver no browser)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/waiter/login')) {
        window.location.href = '/waiter/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;