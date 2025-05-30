import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, useColorScheme, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Formateador de moneda para pesos colombianos (sin decimales)
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

interface Transaccion {
  id: number;
  amount: number;
  created_at: string;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  receiver_name: string;
}

const SISTEMA_ID = 15; // <--- ID del usuario sistema para recargas

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [myId, setMyId] = useState<number | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const userIdStr = await AsyncStorage.getItem('userId');
      const userId = userIdStr ? parseInt(userIdStr, 10) : null;
      setMyId(userId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (myId === null) return;
      setErrorMsg('');
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const response = await fetch('http://192.168.1.7:3000/api/payment/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTransacciones(data.transacciones);
        } else {
          setErrorMsg(data.error || 'Error al obtener transacciones');
        }
      } catch (error) {
        setErrorMsg('No se pudo conectar al servidor');
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [myId]);

  const renderItem = ({ item }: { item: Transaccion }) => {
    const isRecarga = item.sender_id === SISTEMA_ID;
    const isSent = !isRecarga && Number(item.sender_id) === myId;
    const amountFormatted =
      (isRecarga || !isSent ? '+' : '-') + currencyFormatter.format(Number(item.amount));
    const amountColor = isRecarga || !isSent ? '#388e3c' : '#d32f2f';

    return (
      <View style={styles.txCard}>
        <Text style={styles.txTitle}>
          {isRecarga
            ? 'Recarga'
            : isSent
              ? `Enviado a ${item.receiver_name || item.receiver_id}`
              : `Recibido de ${item.sender_name || item.sender_id}`}
        </Text>
        <Text style={[
          styles.txAmount,
          { color: amountColor }
        ]}>
          {amountFormatted}
        </Text>
        <Text style={styles.txDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBox}>
        <Text style={styles.title}>
          Historial de Transacciones
        </Text>
        {loading || myId === null ? (
          <ActivityIndicator size="large" color="#0070ba" />
        ) : errorMsg ? (
          <Text style={styles.errorMsg}>{errorMsg}</Text>
        ) : (
          <FlatList
            data={transacciones}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyMsg}>No hay transacciones.</Text>
            }
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
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
    flex: 1,
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
  txCard: {
    width: '100%',
    backgroundColor: '#f5f8fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0070ba',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
    marginBottom: 4,
  },
  txAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  txDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  errorMsg: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyMsg: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 15,
  },
});






