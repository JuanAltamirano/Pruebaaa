const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// ================================================
// RUTAS DE ADMINISTRACIÓN
// ================================================

// Obtener usuarios con filtros (nombre, email, bloqueo)
router.get('/users', auth, admin, async (req, res) => {
  const { name, email, is_blocked } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (name) {
    query += ` AND name ILIKE $${params.length + 1}`;
    params.push(`%${name}%`);
  }
  if (email) {
    query += ` AND email ILIKE $${params.length + 1}`;
    params.push(`%${email}%`);
  }
  if (is_blocked !== undefined) {
    query += ` AND is_blocked = $${params.length + 1}`;
    params.push(is_blocked === 'true');
  }

  try {
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar usuarios' });
  }
});

// Obtener todas las transacciones
router.get('/transactions', auth, admin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.amount, t.created_at, 
              sender.name AS sender_name, sender.email AS sender_email,
              receiver.name AS receiver_name, receiver.email AS receiver_email
         FROM transactions t
         JOIN users sender ON t.sender_id = sender.id
         JOIN users receiver ON t.receiver_id = receiver.id
         ORDER BY t.created_at DESC`
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// Obtener todas las solicitudes de pago
router.get('/requests', auth, admin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.id, pr.amount, pr.status, pr.created_at,
              u1.name AS requester_name, u1.email AS requester_email,
              u2.name AS receiver_name, u2.email AS receiver_email
         FROM payment_requests pr
         JOIN users u1 ON pr.requester_id = u1.id
         JOIN users u2 ON pr.receiver_id = u2.id
         ORDER BY pr.created_at DESC`
    );
    res.json({ requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

// Eliminar usuario
router.delete('/users/:id', auth, admin, async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador.' });
    }
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
});

// Bloquear usuario
router.put('/users/:id/block', auth, admin, async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'No puedes bloquear tu propia cuenta de administrador.' });
    }
    const result = await pool.query('UPDATE users SET is_blocked = TRUE WHERE id = $1 RETURNING *', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario bloqueado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al bloquear usuario.' });
  }
});

// Desbloquear usuario
router.put('/users/:id/unblock', auth, admin, async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const result = await pool.query(
      'UPDATE users SET is_blocked = FALSE, failed_attempts = 0 WHERE id = $1 RETURNING *',
      [userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario desbloqueado correctamente y contador de intentos reiniciado.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al desbloquear usuario.' });
  }
});

//modifica usuario desde el boton de modificar
const bcrypt = require('bcryptjs');

router.put('/users/:id', auth, admin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, is_admin, is_blocked, password } = req.body;

  try {
    const updates = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      params.push(email);
    }
    if (is_admin !== undefined) {
      updates.push(`is_admin = $${idx++}`);
      params.push(is_admin);
    }
    if (is_blocked !== undefined) {
      updates.push(`is_blocked = $${idx++}`);
      params.push(is_blocked);
    }
    // Manejo de contraseña
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${idx++}`);
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    params.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ 
      message: 'Usuario actualizado correctamente.' + (password ? ' (contraseña modificada)' : ''),
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
});



module.exports = router;



