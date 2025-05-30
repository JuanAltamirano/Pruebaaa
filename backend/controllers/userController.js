const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================================================
// REGISTRO DE USUARIO (CON VALIDACIÓN DE CAMPOS)
// ================================================
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Validación de campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validación de formato de email básico
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validación de longitud mínima de contraseña
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verifica si el usuario ya existe
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserta el usuario
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );
    
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};


// ================================================
// INICIO DE SESIÓN (DEVUELVE token Y userId)
// ================================================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Busca el usuario por email
    const userResult = await pool.query(
      'SELECT id, email, password, is_admin, is_blocked, failed_attempts FROM users WHERE email = $1', 
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // VALIDACIÓN DE USUARIO BLOQUEADO
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Cuenta bloqueada. Llama a soporte para que te desbloqueen la cuenta.' });
    }
    
    // Compara la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Actualizar intentos fallidos
      const newAttempts = user.failed_attempts + 1;
      let bloqueado = false;

      if (newAttempts >= 3) {
        bloqueado = true;
        await pool.query(
          'UPDATE users SET failed_attempts = $1, is_blocked = true WHERE id = $2',
          [newAttempts, user.id]
        );
      } else {
        await pool.query(
          'UPDATE users SET failed_attempts = $1 WHERE id = $2',
          [newAttempts, user.id]
        );
      }

      // Mensaje de error
      const mensajeError = bloqueado 
        ? 'Cuenta bloqueada. Llama a soporte para que te desbloqueen la cuenta.' 
        : `Contraseña incorrecta. Intentos restantes: ${3 - newAttempts}`;

      return res.status(400).json({ error: mensajeError });
    }
    
    // Si el login es exitoso: resetea intentos fallidos
    await pool.query('UPDATE users SET failed_attempts = 0 WHERE id = $1', [user.id]);
    
    // Genera token JWT (incluye is_admin)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        is_admin: user.is_admin
      },
      'secreto',  // Usa process.env.JWT_SECRET en producción
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      userId: user.id
    });
    
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};


// ================================================
// VER PERFIL DEL USUARIO
// ================================================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Incluye si es admin o un usuario normal
    const result = await pool.query('SELECT id, name, email, is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};


// ================================================
// ACTUALIZAR PERFIL
// ================================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, password } = req.body;

    // Validar que al menos un campo esté presente
    if (!name && !email && !password) {
      return res.status(400).json({ error: 'Debes enviar al menos un campo para actualizar' });
    }

    // Construir consulta dinámica
    let query = 'UPDATE users SET';
    const params = [];
    let idx = 1;

    if (name) {
      query += ` name = $${idx},`;
      params.push(name);
      idx++;
    }
    if (email) {
      query += ` email = $${idx},`;
      params.push(email);
      idx++;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ` password = $${idx},`;
      params.push(hashedPassword);
      idx++;
    }

    // Finalizar consulta
    query = query.slice(0, -1) + ` WHERE id = $${idx} RETURNING id, name, email`;
    params.push(userId);

    const result = await pool.query(query, params);
    res.json({ message: 'Perfil actualizado', user: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};


// ================================================
//                 RECARGAR SALDO 
// ================================================
exports.rechargeBalance = async (req, res) => {
  const userId = req.user.userId; // usuario que recarga
  const { amount } = req.body;

  // Validar monto
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Monto inválido' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Sumar el monto al saldo del usuario
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [Number(amount), userId]
    );

    // 2. Registrar la recarga como transacción (sender_id = 15, receiver_id = usuario)
    await client.query(
      'INSERT INTO transactions (sender_id, receiver_id, amount) VALUES ($1, $2, $3)',
      [15, userId, Number(amount)] // 15 es el id del usuario sistema
    );

    await client.query('COMMIT');
    res.json({ message: 'Recarga exitosa' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al recargar saldo:', err);
    res.status(500).json({ error: 'Error al recargar saldo' });
  } finally {
    client.release();
  }
};










