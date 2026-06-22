import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Pick the right URL based on platform ──────────────────────────────────────
// Web browser → localhost
// Android emulator → 10.0.2.2 (special alias for host machine)
// Physical device → your PC's LAN IP (run ipconfig to find it)

const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/auth';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/auth';
  }
  // iOS simulator
  return 'http://localhost:5000/api/auth';
};

const API_BASE_URL = getBaseURL();

const TOKEN_KEY = 'chainstock_token';
const USER_KEY  = 'chainstock_user';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export async function register(name, email, password) {
  const data = await request('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  await persistSession(data);
  return data;
}

export async function login(email, password) {
  const data = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await persistSession(data);
  return data;
}

export async function getCurrentUser() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('No token found');
  return request('/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logout() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  try {
    if (token) {
      await request('/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (err) {
    // ignore logout errors
  } finally {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function persistSession(data) {
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  await AsyncStorage.setItem(
    USER_KEY,
    JSON.stringify({ _id: data._id, name: data.name, email: data.email })
  );
}
