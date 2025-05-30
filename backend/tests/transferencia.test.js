const request = require('supertest');
const app = require('../app');

describe('PaymentService - sendPayment', () => {
  let token;

  beforeAll(async () => {
    // Haz login con un usuario real de pruebas
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'ana@gmail.com', password: '123456' }); // Cambia por el email real de tu BD
    token = res.body.token;
  });

  test('Transferencia válida entre usuarios', async () => {
    const res = await request(app)
      .post('/api/payment/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ receiverEmail: 'juan@gmail.com', amount: 100 }); // Cambia por un email real que exista

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Transferencia exitosa 💸');
  });

  test('Transferencia con saldo insuficiente', async () => {
    const res = await request(app)
      .post('/api/payment/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ receiverEmail: 'otro@correo.com', amount: 1000000 }); // Monto muy alto

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/saldo insuficiente/i);
  });

  test('Transferencia a usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/payment/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ receiverEmail: 'noexiste@correo.com', amount: 5000 });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });
});
