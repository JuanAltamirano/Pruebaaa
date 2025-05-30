const request = require('supertest');
const app = require('../app'); // Asegúrate que app.js exporta solo la app de Express

describe('AuthService - login', () => {
  test('Login con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'juan@gmail.com', password: '123456' }); // Usa un usuario real de tu BD de pruebas

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Login con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'anax.com', password: 'mala' });

    expect(res.statusCode).toBe(400); // O el status que uses para error
    expect(res.body.error).toBeDefined();
  });
});
