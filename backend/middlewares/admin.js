module.exports = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    return next();
  }
  res.status(403).json({ error: 'Acceso solo para administradores' });
};

