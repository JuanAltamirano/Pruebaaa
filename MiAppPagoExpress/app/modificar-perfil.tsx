import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Función para validar la longitud mínima de la contraseña
function validarPassword(password: string): boolean {
  return password.length >= 6;
}

// Función para validar el formato del correo electrónico
function validarEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

export default function ModificarPerfilScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Estados para los datos del perfil y mensajes
  const [id, setId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Al montar el componente, obtener los datos del perfil desde el backend
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://192.168.1.7:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setId(data.id);
          setNombre(data.name || '');
          setCorreo(data.email || '');
        }
      } catch (error) {}
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Maneja la actualización del perfil
  const handleActualizar = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    // Validaciones básicas antes de enviar
    if (!nombre && !correo && !password) {
      setErrorMsg('Debes ingresar al menos un campo para actualizar.');
      setLoading(false);
      return;
    }
    if (correo && !validarEmail(correo)) {
      setErrorMsg('Correo inválido.');
      setLoading(false);
      return;
    }
    if (password && !validarPassword(password)) {
      setErrorMsg('La contraseña debe tener mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setErrorMsg('No autenticado');
        setLoading(false);
        return;
      }
      // Solo envía los campos que el usuario quiere actualizar
      const body: any = {};
      if (nombre) body.name = nombre;
      if (correo) body.email = correo;
      if (password) body.password = password;

      // Envía la actualización al backend
      const response = await fetch('http://192.168.1.7:3000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Perfil actualizado correctamente');
        setPassword('');
        // Redirige al perfil después de un breve tiempo
        setTimeout(() => {
          router.replace('/perfil');
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      setErrorMsg('Error de conexión');
    }
    setLoading(false);
  };

  // Navega de regreso al perfil
  const handleAtras = () => {
    router.replace('/perfil');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <Text style={styles.title}>Modificar Perfil</Text>
        {/* Muestra el spinner de carga si está cargando */}
        {loading && <ActivityIndicator size="large" color="#0070ba" style={{ marginVertical: 10 }} />}

        {/* Muestra el ID del usuario si está disponible */}
        {id !== null && (
          <View style={styles.idContainer}>
            <Text style={styles.label}>ID de usuario</Text>
            <Text style={styles.value}>{id}</Text>
          </View>
        )}

        {/* Inputs para modificar nombre, correo y contraseña */}
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nuevo nombre"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <TextInput
          value={correo}
          onChangeText={setCorreo}
          placeholder="Nuevo correo"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Nueva contraseña"
          secureTextEntry
          placeholderTextColor="#888"
          style={styles.input}
        />

        {/* Mensajes de error o éxito */}
        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={styles.successMsg}>{successMsg}</Text> : null}

        {/* Botón para actualizar perfil */}
        <TouchableOpacity style={styles.button} onPress={handleActualizar} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Actualizando...' : 'Actualizar'}</Text>
        </TouchableOpacity>
        {/* Botón para volver atrás */}
        <TouchableOpacity style={[styles.button, { backgroundColor: '#888', marginTop: 8 }]} onPress={handleAtras}>
          <Text style={styles.buttonText}>Atrás</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Estilos para la pantalla de modificación de perfil
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
  idContainer: {
    width: '100%',
    marginBottom: 10,
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
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    color: '#222',
  },
  button: {
    width: '100%',
    backgroundColor: '#0070ba',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorMsg: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  successMsg: {
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
});




