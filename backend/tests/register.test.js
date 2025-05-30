const request = require('supertest');
const app = require('../app');

describe('UserService - registerUser', () => {
  test('Registro con datos válidos', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ name: 'Anaaaa', email: 'anaaaa@gmail.com', password: '123456' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Usuario registrado correctamente');

  });

  test('Registro con email existente', async () => {
    // Primero crea el usuario
    await request(app)
      .post('/api/user/register')
      .send({ name: 'juan', email: 'juan@gmail.com', password: '123456' });

    // Luego intenta crear el mismo usuario
    const res = await request(app)
      .post('/api/user/register')
      .send({ name: 'Ana', email: 'ana@gmail.com', password: '123456' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/existe/i);


  });
});
