const request = require('supertest');
const app = require('../app');

describe('PaymentService - recharge', () => {
  let token;

  beforeAll(async () => {
    // Haz login para obtener el token
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'ana@gmail.com', password: '123456' }); // Usa un usuario válido de tu BD de pruebas
    token = res.body.token;
  });

  test('Recarga de saldo válida', async () => {
    const res = await request(app)
      .post('/api/user/recharge')
      .set('Authorization', `Bearer ${token}`) // Envía el token aquí
      .send({ userId: 2, amount: 50000 });
    expect(res.statusCode).toBe(200);
  });
});
