import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SendScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Solo permite números en el campo monto
  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setAmount(numericText);
  };

  const handleSend = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    // Validaciones frontend
    if (!recipient.trim() || !amount.trim()) {
      setErrorMsg('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(recipient)) {
      setErrorMsg('Ingresa un email válido.');
      setLoading(false);
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Monto debe ser mayor a 0.');
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('http://192.168.1.7:3000/api/payment/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            receiverEmail: recipient.trim(),
            amount: numericAmount,
        }),
      });

      // --- LOGS PARA DEPURAR ---
      console.log('Status de la respuesta:', response.status);

      let data = null;
      try {
        data = await response.json();
        console.log('Respuesta del backend:', data);
      } catch (jsonErr) {
        console.log('No se pudo parsear JSON:', jsonErr);
      }
      // --- FIN DE LOGS ---

      if (!response.ok) {
        // Manejo de errores específicos del backend
        if (data && data.error && data.error.includes('no encontrado')) {
          setErrorMsg('El destinatario no existe');
        } else if (data && data.error && data.error.includes('insuficiente')) {
          setErrorMsg('Saldo insuficiente');
        } else {
          setErrorMsg((data && data.error) || 'Error al enviar');
        }
        setLoading(false);
        return;
      }

      // Éxito
      setSuccessMsg(`¡Enviado $${numericAmount} a ${recipient}!`);
      setRecipient('');
      setAmount('');
      setTimeout(() => router.replace('/dashboard'), 2000);

    } catch (error) {
      console.error(error);
      setErrorMsg('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <Text style={styles.title}>Enviar Dinero</Text>

        <TextInput
          placeholder="Correo del destinatario"
          placeholderTextColor={isDark ? '#888' : '#666'}
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          placeholder="Monto"
          placeholderTextColor={isDark ? '#888' : '#666'}
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          maxLength={10}
          style={styles.input}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0070ba" style={{ marginVertical: 10 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSend}>
            <Text style={styles.buttonText}>Enviar</Text>
          </TouchableOpacity>
        )}

        {errorMsg ? (
          <Text style={styles.errorMsg}>{errorMsg}</Text>
        ) : null}

        {successMsg ? (
          <Text style={styles.successMsg}>{successMsg}</Text>
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
    marginBottom: 12,
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





