import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces para tipar los datos
interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_blocked: boolean;
}

interface Transaction {
  id: number;
  amount: number;
  created_at: string;
  sender_name: string;
  sender_email: string;
  receiver_name: string;
  receiver_email: string;
}

interface Request {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  receiver_name: string;
  receiver_email: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState<'usuarios' | 'transacciones' | 'solicitudes'>('usuarios');

  // Estado para editar usuario
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editIsBlocked, setEditIsBlocked] = useState(false);
  const [editPassword, setEditPassword] = useState(''); // Nuevo estado para la contraseña

  const fetchData = async () => {
    setLoading(true);
    setMsg('');
    try {
      const token = await AsyncStorage.getItem('token');
      // Usuarios
      let url = `http://192.168.1.7:3000/api/admin/users?`;
      if (searchName) url += `name=${encodeURIComponent(searchName)}&`;
      if (searchEmail) url += `email=${encodeURIComponent(searchEmail)}&`;
      const resUsers = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const dataUsers = await resUsers.json();
      setUsers(dataUsers.users || []);

      // Transacciones
      const resTx = await fetch('http://192.168.1.7:3000/api/admin/transactions', { headers: { Authorization: `Bearer ${token}` } });
      const dataTx = await resTx.json();
      setTransactions(dataTx.transactions || []);

      // Solicitudes
      const resReq = await fetch('http://192.168.1.7:3000/api/admin/requests', { headers: { Authorization: `Bearer ${token}` } });
      const dataReq = await resReq.json();
      setRequests(dataReq.requests || []);
    } catch (error) {
      console.error(error);
      setMsg('Error de conexión o permisos insuficientes');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Buscar usuarios por nombre/email
  const handleSearch = () => {
    fetchData();
  };

  // Eliminar usuario (sin confirmación, multiplataforma)
  const eliminarUsuario = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.7:3000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMsg(data.message || data.error);
      fetchData();
    } catch (error) {
      console.error(error);
      setMsg('Error al eliminar usuario');
    }
  };

  // Bloquear usuario
  const bloquearUsuario = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.7:3000/api/admin/users/${id}/block`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMsg(data.message || data.error);
      fetchData();
    } catch (error) {
      console.error(error);
      setMsg('Error al bloquear usuario');
    }
  };

  // Desbloquear usuario
  const desbloquearUsuario = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`http://192.168.1.7:3000/api/admin/users/${id}/unblock`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMsg(data.message || data.error);
      fetchData();
    } catch (error) {
      console.error(error);
      setMsg('Error al desbloquear usuario');
    }
  };

  // Abrir modal de editar usuario
  const handleEditUser = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditIsAdmin(user.is_admin);
    setEditIsBlocked(user.is_blocked);
    setEditPassword('');
    setShowEditModal(true);
  };

  // Guardar cambios de usuario (incluye contraseña)
  const guardarCambiosUsuario = async () => {
    if (!editUser) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const body: any = {
        name: editName,
        email: editEmail,
        is_admin: editIsAdmin,
        is_blocked: editIsBlocked,
      };
      if (editPassword.trim() !== '') {
        body.password = editPassword;
      }
      const res = await fetch(`http://192.168.1.7:3000/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg(data.message || data.error);
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      setMsg('Error al modificar usuario');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Panel de Administración</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: '#fff' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'usuarios' && styles.tabBtnActive]} onPress={() => setTab('usuarios')}>
          <Text style={[styles.tabText, tab === 'usuarios' && styles.tabTextActive]}>Usuarios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'transacciones' && styles.tabBtnActive]} onPress={() => setTab('transacciones')}>
          <Text style={[styles.tabText, tab === 'transacciones' && styles.tabTextActive]}>Transacciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'solicitudes' && styles.tabBtnActive]} onPress={() => setTab('solicitudes')}>
          <Text style={[styles.tabText, tab === 'solicitudes' && styles.tabTextActive]}>Solicitudes</Text>
        </TouchableOpacity>
      </View>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color="#0070ba" style={{ marginTop: 30 }} />
      ) : (
        <>
          {tab === 'usuarios' && (
            <View style={{ width: '100%', maxWidth: 500, flex: 1 }}>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar por nombre"
                  value={searchName}
                  onChangeText={setSearchName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Buscar por email"
                  value={searchEmail}
                  onChangeText={setSearchEmail}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  <Text style={{ color: '#fff' }}>Buscar</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Text style={styles.userName}>{item.name} {item.is_admin ? '👑' : ''}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={{ color: item.is_blocked ? 'red' : 'green', marginBottom: 4 }}>
                      {item.is_blocked ? 'Bloqueado' : 'Activo'}
                    </Text>
                    <View style={styles.row}>
                      {!item.is_admin && (
                        <>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => eliminarUsuario(item.id)}>
                            <Text style={{ color: '#fff' }}>Eliminar</Text>
                          </TouchableOpacity>
                          {item.is_blocked ? (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => desbloquearUsuario(item.id)}>
                              <Text style={{ color: '#fff' }}>Desbloquear</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => bloquearUsuario(item.id)}>
                              <Text style={{ color: '#fff' }}>Bloquear</Text>
                            </TouchableOpacity>
                          )}
                          {/* Botón Modificar */}
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ffa500' }]} onPress={() => handleEditUser(item)}>
                            <Text style={{ color: '#fff' }}>Modificar</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay usuarios.</Text>}
                contentContainerStyle={{ paddingBottom: 40 }}
                style={{ flexGrow: 0 }}
              />
            </View>
          )}
          {tab === 'transacciones' && (
            <View style={{ width: '100%', maxWidth: 500, flex: 1 }}>
              <FlatList
                data={transactions}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Text style={styles.userName}>Monto: ${item.amount}</Text>
                    <Text>De: {item.sender_name} ({item.sender_email})</Text>
                    <Text>Para: {item.receiver_name} ({item.receiver_email})</Text>
                    <Text style={styles.userEmail}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay transacciones.</Text>}
                contentContainerStyle={{ paddingBottom: 40 }}
                style={{ flexGrow: 0 }}
              />
            </View>
          )}
          {tab === 'solicitudes' && (
            <View style={{ width: '100%', maxWidth: 500, flex: 1 }}>
              <FlatList
                data={requests}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Text style={styles.userName}>Monto: ${item.amount}</Text>
                    <Text>Solicitante: {item.requester_name} ({item.requester_email})</Text>
                    <Text>Receptor: {item.receiver_name} ({item.receiver_email})</Text>
                    <Text>Estado: {item.status}</Text>
                    <Text style={styles.userEmail}>{new Date(item.created_at).toLocaleString()}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay solicitudes.</Text>}
                contentContainerStyle={{ paddingBottom: 40 }}
                style={{ flexGrow: 0 }}
              />
            </View>
          )}
          {/* Modal de edición de usuario */}
          <Modal
            visible={showEditModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Modificar usuario</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nombre"
                  style={styles.inputModal}
                />
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Correo"
                  style={styles.inputModal}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                  style={styles.inputModal}
                  secureTextEntry
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ marginRight: 10 }}>Admin:</Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: editIsAdmin ? '#388e3c' : '#888', paddingHorizontal: 16 }]}
                    onPress={() => setEditIsAdmin(!editIsAdmin)}
                  >
                    <Text style={{ color: '#fff' }}>{editIsAdmin ? 'Sí' : 'No'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ marginRight: 10 }}>Bloqueado:</Text>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: editIsBlocked ? '#d32f2f' : '#888', paddingHorizontal: 16 }]}
                    onPress={() => setEditIsBlocked(!editIsBlocked)}
                  >
                    <Text style={{ color: '#fff' }}>{editIsBlocked ? 'Sí' : 'No'}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0070ba', marginBottom: 8 }]} onPress={guardarCambiosUsuario}>
                  <Text style={{ color: '#fff' }}>Guardar cambios</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#888' }]} onPress={() => setShowEditModal(false)}>
                  <Text style={{ color: '#fff' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', backgroundColor: '#f5f8fa', padding: 18,
  },
  header: {
    width: '100%', maxWidth: 500, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18,
  },
  logo: {
    fontSize: 26, fontWeight: 'bold', color: '#0070ba', letterSpacing: 1,
  },
  logoutBtn: {
    backgroundColor: '#0070ba', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  tabs: {
    flexDirection: 'row', marginBottom: 18, width: '100%', maxWidth: 500, justifyContent: 'center',
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomColor: '#0070ba',
  },
  tabText: {
    fontSize: 16, color: '#888',
  },
  tabTextActive: {
    color: '#0070ba', fontWeight: 'bold',
  },
  msg: {
    color: 'red', textAlign: 'center', marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row', marginBottom: 10, gap: 4,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 15, backgroundColor: '#fff',
  },
  inputModal: {
    width: 240, // Fijo para que siempre se vea bien
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  searchBtn: {
    backgroundColor: '#0070ba', borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#0070ba', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  userName: {
    fontWeight: 'bold', fontSize: 16, color: '#222',
  },
  userEmail: {
    color: '#888', fontSize: 13,
  },
  row: {
    flexDirection: 'row', gap: 10, marginTop: 8,
  },
  actionBtn: {
    backgroundColor: '#0070ba', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
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
});
