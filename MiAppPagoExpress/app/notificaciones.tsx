import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, useColorScheme, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

interface Solicitud {
  id: number;
  amount: number;
  requester_name: string;
  requester_email: string;
  created_at: string;
}

export default function NotificacionesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [balance, setBalance] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const token = await AsyncStorage.getItem('token');
      // Obtener solicitudes
      const resReq = await fetch('http://192.168.1.7:3000/api/payment/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataReq = await resReq.json();
      if (resReq.ok) {
        setSolicitudes(dataReq.requests);
      } else {
        setErrorMsg(dataReq.error || 'Error al cargar solicitudes');
      }

      // Obtener saldo
      const resBal = await fetch('http://192.168.1.7:3000/api/user/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataBal = await resBal.json();
      if (resBal.ok && dataBal.saldo !== undefined) {
        setBalance(Number(dataBal.saldo));
      }
    } catch (error) {
      setErrorMsg('Error de conexión');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const aceptarSolicitud = async (id: number, amount: number) => {
    const saldoActual = Number(balance);
    const montoSolicitud = Number(amount);

    // Log para depuración
    console.log('Comparando saldo:', saldoActual, typeof saldoActual, 'con monto:', montoSolicitud, typeof montoSolicitud);

    if (balance === null || isNaN(saldoActual) || isNaN(montoSolicitud)) {
      setErrorMsg('Error: saldo o monto inválido');
      return;
    }

    if (saldoActual < montoSolicitud) {
      setErrorMsg('No tienes suficiente saldo para aceptar esta solicitud.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.1.7:3000/api/payment/requests/${id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Solicitud aceptada y pago realizado');
        fetchData();  // Recargar datos actualizados
      } else {
        setErrorMsg(data.error || 'Error al aceptar la solicitud');
      }
    } catch (error) {
      setErrorMsg('Error de conexión');
    }
  };

  const denegarSolicitud = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.1.7:3000/api/payment/requests/${id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Solicitud rechazada');
        fetchData();  // Recargar datos actualizados
      } else {
        setErrorMsg(data.error || 'Error al rechazar la solicitud');
      }
    } catch (error) {
      setErrorMsg('Error de conexión');
    }
  };

  const renderItem = ({ item }: { item: Solicitud }) => (
    <View style={[styles.card, { backgroundColor: isDark ? '#222' : '#f2f2f2' }]}>
      <Text style={{ color: isDark ? '#fff' : '#222', fontWeight: 'bold' }}>
        {item.requester_name} ({item.requester_email})
      </Text>
      <Text style={{ color: isDark ? '#ccc' : '#666' }}>
        Monto: {currencyFormatter.format(item.amount)}
      </Text>
      <Text style={{ color: isDark ? '#ccc' : '#888', fontSize: 12 }}>
        Fecha: {new Date(item.created_at).toLocaleDateString()}
      </Text>

      <View style={styles.botonesContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
          onPress={() => aceptarSolicitud(item.id, Number(item.amount))}
        >
          <Text style={styles.btnText}>Aceptar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#f44336' }]}
          onPress={() => denegarSolicitud(item.id)}
        >
          <Text style={styles.btnText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#222' }]}>Notificaciones</Text>

      {balance !== null && (
        <Text style={[styles.saldoText, { color: isDark ? '#fff' : '#222' }]}>
          Saldo actual: {currencyFormatter.format(balance)}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#222'} />
      ) : errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : (
        <FlatList
          data={solicitudes}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: isDark ? '#ccc' : '#888' }]}>
              No hay solicitudes pendientes
            </Text>
          }
        />
      )}

      {successMsg && <Text style={styles.success}>{successMsg}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  saldoText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
});




