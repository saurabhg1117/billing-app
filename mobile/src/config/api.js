/**
 * API configuration for mobile app.
 * - DEPLOYED: Set to your backend URL when using on phone with deployed backend (e.g. 'https://your-app.onrender.com/api')
 * - Local: Set to null to use localhost / 10.0.2.2
 */
import { Platform } from 'react-native';

// Set your deployed backend URL here (e.g. 'https://wedding-billing.onrender.com/api') or null for local
const DEPLOYED_API_URL = null;

const getApiBase = () => {
  if (DEPLOYED_API_URL) {
    return DEPLOYED_API_URL.replace(/\/$/, '');
  }
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:5000/api`;
};

export const API_BASE = getApiBase();
