const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Obtén el header de autorización
  const authHeader = req.headers['authorization'];
  // El token debe venir en el formato: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token requerido' });
  }

  try {
    // Verifica el token (usa process.env.JWT_SECRET en producción)
    const verified = jwt.verify(token, 'secreto');
    req.user = verified; // Ahora puedes acceder a req.user en los controladores
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token no válido' });
  }
};





