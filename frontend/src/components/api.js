// Bu dosya, backend sunucumuzun adresini tüm diğer bileşenlere sağlar.

// Yerel geliştirme için:
// export const API_URL = 'http://127.0.0.1:8000'; 

// Vercel'de yayınlamak için (canlı sunucu adresi):
export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
