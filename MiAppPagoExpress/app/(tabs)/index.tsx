import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#003366' : '#e6f0fa' }]}>
      <View style={styles.card}>
        {/* Logo o nombre de la app */}
        <Text style={styles.logo}>
          PagoExpress
        </Text>

        {/* Slogan */}
        <Text style={[styles.slogan, { color: isDark ? '#fff' : '#003366' }]}>
          La forma fácil y segura de enviar y recibir pagos en línea
        </Text>

        {/* Sobre nosotros */}
        <View style={[styles.aboutBox, { backgroundColor: isDark ? '#222' : '#fff' }]}>
          <Text style={[styles.aboutText, { color: isDark ? '#fff' : '#222' }]}>
            Somos una plataforma que te permite enviar y recibir pagos de forma rápida, sencilla y segura. Ideal para compras, ventas y transferencias entre personas.
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.mainBtnText}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineBtn, { backgroundColor: isDark ? '#444' : '#fff' }]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.outlineBtnText}>
              Registrarse
            </Text>
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
    maxWidth: 420,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0070ba',
    marginBottom: 8,
    textAlign: 'center',
  },
  slogan: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  aboutBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutText: {
    fontSize: 16,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  mainBtn: {
    backgroundColor: '#0070ba',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
    marginRight: 0,
  },
  mainBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  outlineBtn: {
    borderWidth: 2,
    borderColor: '#0070ba',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#0070ba',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

