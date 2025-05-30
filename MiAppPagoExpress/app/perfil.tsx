import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, useColorScheme, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface Perfil {
  id: number;
  name: string;
  email: string;
}

export default function PerfilScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      setErrorMsg('');
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setErrorMsg('Debes iniciar sesión');
          setLoading(false);
          return;
        }
        const response = await fetch('http://192.168.1.7:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setPerfil(data);
        } else {
          setErrorMsg(data.error || 'Error al cargar perfil');
        }
      } catch (error) {
        setErrorMsg('Error de conexión');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
    router.replace('/login');
  };

  const handleModificar = () => {
    router.push('/modificar-perfil');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <Text style={styles.title}>Mi Perfil</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0070ba" style={{ marginVertical: 10 }} />
        ) : errorMsg ? (
          <Text style={styles.error}>{errorMsg}</Text>
        ) : perfil ? (
          <View style={styles.card}>
            <Text style={styles.label}>ID de usuario</Text>
            <Text style={styles.value}>{perfil.id}</Text>

            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{perfil.name}</Text>

            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{perfil.email}</Text>

            <TouchableOpacity style={styles.button} onPress={handleModificar}>
              <Text style={styles.buttonText}>Modificar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#888', marginTop: 8 }]} onPress={handleLogout}>
              <Text style={styles.buttonText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contentBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0070ba',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0070ba',
    marginBottom: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'flex-start',
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginTop: 15,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#222',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    backgroundColor: '#0070ba',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
});
