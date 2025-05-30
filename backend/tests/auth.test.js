const request = require('supertest');
const app = require('../app.js'); // Asegúrate de que la ruta sea correcta

test('Login con credenciales válidas', async () => {
  const res = await request(app)
    .post('/api/user/login')
    .send({ email: 'juan@gmail.com', password: '123456' });
  
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('token');
});
