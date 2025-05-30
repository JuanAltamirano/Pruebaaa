import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, useColorScheme, StyleSheet, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';

const icons = {
  perfil: '👤',
  enviar: '💸',
  solicitar: '📝',
  transacciones: '📄',
  recargar: '➕',
  notificaciones: '🔔',
  cerrar: '🚪',
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados para recarga
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState('');

  // Redirección automática si es admin
  useEffect(() => {
    const checkRole = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      const res = await fetch('http://192.168.1.7:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (data.is_admin) {
        router.replace('/admin'); // Si es admin, redirige a admin y no muestra dashboard normal
        return;
      }
      setUser(data);
      setLoading(false);
    };
    checkRole();
  }, []);

  const fetchProfileAndBalance = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      // Obtener perfil
      const resProfile = await fetch('http://192.168.1.7:3000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resProfile.ok) {
        const data = await resProfile.json();
        setUser(data);
      } else {
        await AsyncStorage.removeItem('token');
        router.replace('/login');
        setLoading(false);
        return;
      }

      // Obtener saldo
      const resBalance = await fetch('http://192.168.1.7:3000/api/user/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let balanceData = null;
      try {
        balanceData = await resBalance.json();
      } catch (err) {
        console.log('Error parseando JSON de balance:', err);
      }
      if (resBalance.ok && balanceData && balanceData.saldo !== undefined) {
        const saldoNumber = Number(balanceData.saldo);
        setBalance(isNaN(saldoNumber) ? 0 : saldoNumber);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error(error);
      setUser(null);
      setBalance(0);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileAndBalance();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  // Función para recargar saldo
  const handleRecharge = async () => {
    setRechargeMsg('');
    if (!rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0) {
      setRechargeMsg('Monto inválido');
      return;
    }
    setRechargeLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch('http://192.168.1.7:3000/api/user/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(rechargeAmount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setRechargeMsg('Recarga exitosa');
        setRechargeAmount('');
        setShowRecharge(false);
        fetchProfileAndBalance();
      } else {
        setRechargeMsg(data.error || 'Error al recargar');
      }
    } catch (error) {
      console.error(error);
      setRechargeMsg('Error de conexión');
    }
    setRechargeLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#f5f8fa' }]}>
        <ActivityIndicator size="large" color="#0070ba" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dashboardBox}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.logo}>PagoExpress</Text>
          <TouchableOpacity onPress={() => router.push('/notificaciones')}>
            <Text style={styles.headerIcon}>{icons.notificaciones}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.headerIcon}>{icons.cerrar}</Text>
          </TouchableOpacity>
        </View>

        {/* Saludo personalizado */}
        {user && user.name && (
          <Text style={{
            fontSize: 22,
            fontWeight: '600',
            color: '#0070ba',
            marginBottom: 18,
            alignSelf: 'flex-start',
          }}>
            Hola, {user.name}
          </Text>
        )}

        {/* Tarjeta de saldo */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceValue}>{currencyFormatter.format(balance)}</Text>
        </View>

        {/* Botones principales como íconos */}
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/perfil')}>
            <Text style={styles.iconEmoji}>{icons.perfil}</Text>
            <Text style={styles.iconText}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/send')}>
            <Text style={styles.iconEmoji}>{icons.enviar}</Text>
            <Text style={styles.iconText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/request')}>
            <Text style={styles.iconEmoji}>{icons.solicitar}</Text>
            <Text style={styles.iconText}>Solicitar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/transactions')}>
            <Text style={styles.iconEmoji}>{icons.transacciones}</Text>
            <Text style={styles.iconText}>Transacciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowRecharge(true)}>
            <Text style={styles.iconEmoji}>{icons.recargar}</Text>
            <Text style={styles.iconText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de recarga */}
      {showRecharge && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' }}>Recargar saldo</Text>
            <TextInput
              value={rechargeAmount}
              onChangeText={text => setRechargeAmount(text.replace(/[^0-9]/g, ''))}
              placeholder="Monto"
              keyboardType="numeric"
              maxLength={10}
              style={styles.rechargeInput}
            />
            {rechargeMsg ? <Text style={{ color: 'red', marginBottom: 8, textAlign: 'center' }}>{rechargeMsg}</Text> : null}
            <Button title="Confirmar recarga" onPress={handleRecharge} disabled={rechargeLoading} />
            <Button title="Cancelar" onPress={() => setShowRecharge(false)} color="#888" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f8fa',
    padding: 24,
  },
  dashboardBox: {
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0070ba',
    letterSpacing: 1,
  },
  headerIcon: {
    fontSize: 22,
    marginLeft: 16,
  },
  balanceCard: {
    width: '100%',
    backgroundColor: '#e6f0fa',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#0070ba',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0070ba',
    marginBottom: 2,
    letterSpacing: 1,
  },
  iconRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  iconBtn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f5f8fa',
    elevation: 1,
    shadowColor: '#0070ba',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconEmoji: {
    fontSize: 30,
    marginBottom: 3,
  },
  iconText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0070ba',
  },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
  },
  rechargeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
    fontSize: 16,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8'
  },
});
