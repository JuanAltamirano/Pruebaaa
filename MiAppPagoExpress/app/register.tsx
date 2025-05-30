import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState(''); // Nuevo estado
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validación frontend
    if (!name.trim() || !email.trim() || !password.trim() || !repeatPassword.trim()) {
      setErrorMsg('Por favor, completa todos los campos.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg('Ingresa un email válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== repeatPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.7:3000/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('¡Registro exitoso! Ahora puedes iniciar sesión.');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Error al registrar');
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
        <Text style={styles.slogan}>Crea tu cuenta para comenzar</Text>

        <TextInput
          placeholder="Nombre"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Repite la contraseña"
          placeholderTextColor={isDark ? '#888' : '#aaa'}
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          secureTextEntry
          style={styles.input}
        />

        {errorMsg ? (
          <Text style={styles.errorMsg}>{errorMsg}</Text>
        ) : null}
        {successMsg ? (
          <Text style={styles.successMsg}>{successMsg}</Text>
        ) : null}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.replace('/login')}
            disabled={loading}
          >
            <Text style={styles.outlineBtnText}>¿Ya tienes cuenta?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.mainBtnText}>Registrarse</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
    gap: 8,
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
  successMsg: {
    color: 'green',
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
  },
});



