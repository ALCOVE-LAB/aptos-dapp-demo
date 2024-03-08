import axios from 'axios';

const R = axios.create({
  baseURL: import.meta.env.VITE_APP_HOST_URL,
});

R.interceptors.response.use((res: any) => {
  return res.data;
});

export default R;

