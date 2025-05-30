import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pantalla de inicio de sesión
export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ref para el input de contraseña
  const passwordRef = useRef<TextInput>(null);

  // Maneja el login del usuario
  const handleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      // Solicita login al backend
      const response = await fetch('http://192.168.1.7:3000/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Guarda token y userId en almacenamiento local
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userId', String(data.userId));

        // Obtiene el perfil para saber si es admin o usuario normal
        const resProfile = await fetch('http://192.168.1.7:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const profile = await resProfile.json();

        // Redirige según el rol
        if (
          resProfile.ok &&
          (profile.is_admin === true ||
            profile.isAdmin === true ||
            profile.role === 'admin')
        ) {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
        setErrorMsg('');
      } else {
        // Muestra mensaje de error del backend
        setErrorMsg(data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      setErrorMsg('No se pudo conectar al servidor');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#003366' : '#e6f0fa' }]}>
      <View style={styles.card}>
        <Text style={styles.logo}>PagoExpress</Text>
        <Text style={styles.slogan}>¡Bienvenido! Ingresa tus datos para continuar</Text>

        {/* Input de correo */}
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()} // Enfoca el input de contraseña al presionar Enter
        />
        {/* Input de contraseña */}
        <TextInput
          ref={passwordRef}
          placeholder="Contraseña"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          returnKeyType="go"
          onSubmitEditing={handleLogin} // Ejecuta el login al presionar Enter
        />

        {/* Mensaje de error o bloqueo */}
        {errorMsg ? (
          errorMsg.toLowerCase().includes("bloqueada") || errorMsg.toLowerCase().includes("soporte") ? (
            <View style={styles.blockedMsgBox}>
              <Text style={styles.blockedIcon}>⛔</Text>
              <Text style={styles.blockedMsg}>{errorMsg}</Text>
            </View>
          ) : (
            <Text style={styles.errorMsg}>{errorMsg}</Text>
          )
        ) : null}

        {/* Botones de navegación y login */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.outlineBtn, { marginRight: 8 }]}
            onPress={() => router.replace('/')}
            disabled={loading}
          >
            <Text style={styles.outlineBtnText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Estilos de la pantalla de login
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f0fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0070ba',
    marginBottom: 8,
    textAlign: 'center',
  },
  slogan: {
    fontSize: 16,
    color: '#003366',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    color: '#222',
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  mainBtn: {
    flex: 1,
    backgroundColor: '#0070ba',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  outlineBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0070ba',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#0070ba',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorMsg: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
  },
  blockedMsgBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  blockedIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  blockedMsg: {
    color: '#856404',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
  },
});
