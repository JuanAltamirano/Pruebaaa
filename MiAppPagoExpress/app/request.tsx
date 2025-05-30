import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RequestScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Solo permite números en el campo monto
  const handleAmountChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setAmount(numericText);
  };

  const handleRequest = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validaciones básicas
    if (!receiverEmail || !amount) {
      setErrorMsg('Completa todos los campos');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(receiverEmail)) {
      setErrorMsg('Correo inválido');
      return;
    }
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Monto inválido');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setErrorMsg('No autenticado');
        setLoading(false);
        return;
      }
      const response = await fetch('http://192.168.1.7:3000/api/payment/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverEmail, amount: numericAmount }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Solicitud enviada correctamente');
        setReceiverEmail('');
        setAmount('');
      } else {
        setErrorMsg(data.error || 'Error al solicitar pago');
      }
    } catch (error) {
      setErrorMsg('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <Text style={styles.title}>Solicitar Dinero</Text>

        <TextInput
          value={receiverEmail}
          onChangeText={setReceiverEmail}
          placeholder="Correo del destinatario"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={isDark ? '#888' : '#666'}
          style={styles.input}
        />

        <TextInput
          value={amount}
          onChangeText={handleAmountChange}
          placeholder="Monto"
          keyboardType="numeric"
          maxLength={10}
          placeholderTextColor={isDark ? '#888' : '#666'}
          style={styles.input}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0070ba" style={{ marginVertical: 10 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleRequest}>
            <Text style={styles.buttonText}>Solicitar</Text>
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


