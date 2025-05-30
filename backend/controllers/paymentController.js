const pool = require('../config/db');

// ================================================
// ENVIAR PAGO ENTRE USUARIOS (CON TRANSACCIÓN)
// ================================================
exports.sendPayment = async (req, res) => {
  const senderId = req.user.userId;
  const { receiverEmail, amount } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validar existencia del receptor
    const receiverResult = await client.query(
      'SELECT id FROM users WHERE email = $1', 
      [receiverEmail]
    );
    
    if (receiverResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario receptor no encontrado' });
    }
    const receiverId = receiverResult.rows[0].id;

    // 2. Validaciones de seguridad
    if (senderId === receiverId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No puedes enviarte dinero a ti mismo' });
    }

    if (amount <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Monto inválido (debe ser > 0)' });
    }

    // 3. Verificar saldo del remitente
    const senderBalance = await client.query(
      'SELECT balance FROM users WHERE id = $1', 
      [senderId]
    );
    
    if (senderBalance.rows[0].balance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // 4. Ejecutar transferencia
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [amount, senderId]
    );

    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [amount, receiverId]
    );

    // 5. Registrar transacción
    await client.query(
      'INSERT INTO transactions (sender_id, receiver_id, amount) VALUES ($1, $2, $3)',
      [senderId, receiverId, amount]
    );

    await client.query('COMMIT');
    res.json({ message: 'Transferencia exitosa 💸' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en transferencia:', err);
    res.status(500).json({ error: 'Error interno al procesar el pago' });
  } finally {
    client.release();
  }
};

// ================================================
// HISTORIAL DE TRANSACCIONES
// ================================================
exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
    `SELECT 
    t.id,
    t.amount,
    t.created_at,
    t.sender_id,
    t.receiver_id,
    sender.name AS sender_name,
    receiver.name AS receiver_name
   FROM transactions t
   JOIN users sender ON t.sender_id = sender.id
   JOIN users receiver ON t.receiver_id = receiver.id
   WHERE t.sender_id = $1 OR t.receiver_id = $1
   ORDER BY t.created_at DESC`,
  [req.user.userId]
);

    
    res.json({ transacciones: result.rows });
  } catch (err) {
    console.error('Error obteniendo historial:', err);
    res.status(500).json({ error: 'Error al recuperar historial' });
  }
};

// ================================================
// CONSULTA DE SALDO
// ================================================
exports.getBalance = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT balance FROM users WHERE id = $1',
      [req.user.userId]
    );
    // Convierte a número, pero deja el nombre 'saldo'
    const saldo = Number(result.rows[0].balance);
    res.json({ saldo }); // <-- el campo sigue siendo 'saldo'
  } catch (err) {
    console.error('Error consultando saldo:', err);
    res.status(500).json({ error: 'Error al obtener saldo' });
  }
};


// ================================================
// SOLICITUD DE PAGO A OTRO USUARIO
// ================================================
exports.requestPayment = async (req, res) => {
  const requesterId = req.user.userId;
  const { receiverEmail, amount } = req.body;
  
  try {
    // Buscar receptor
    const receiverResult = await pool.query('SELECT id FROM users WHERE email = $1', [receiverEmail]);
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario receptor no encontrado' });
    }
    const receiverId = receiverResult.rows[0].id;

    // Validar no auto-solicitud
    if (requesterId === receiverId) {
      return res.status(400).json({ error: 'No puedes solicitarte dinero a ti mismo' });
    }

    // Validar monto positivo
    if (amount <= 0) {
      return res.status(400).json({ error: 'Monto debe ser mayor a cero' });
    }

    // Crear solicitud
    await pool.query(
      'INSERT INTO payment_requests (requester_id, receiver_id, amount) VALUES ($1, $2, $3)',
      [requesterId, receiverId, amount]
    );

    res.status(201).json({ message: 'Solicitud de pago enviada correctamente' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error al crear solicitud de pago' });
  }
};

// ================================================
// LISTAR SOLICITUDES DE PAGO PENDIENTES
// ================================================
exports.getPaymentRequests = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT 
        pr.id, 
        pr.amount, 
        pr.status,
        pr.created_at, 
        u1.name AS requester_name, 
        u1.email AS requester_email
       FROM payment_requests pr
       JOIN users u1 ON pr.requester_id = u1.id
       WHERE pr.receiver_id = $1 AND pr.status = 'pending'
       ORDER BY pr.created_at DESC`,
      [userId]
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Error al obtener solicitudes:', err);
    res.status(500).json({ error: 'Error al obtener solicitudes de pago' });
  }
};

// ================================================
// ACEPTAR SOLICITUD DE PAGO
// ================================================
exports.acceptPaymentRequest = async (req, res) => {
  const userId = req.user.userId;
  const { requestId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener la solicitud pendiente
    const requestResult = await client.query(
      'SELECT requester_id, receiver_id, amount FROM payment_requests WHERE id = $1 AND status = \'pending\'',
      [requestId]
    );
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }
    const { requester_id, receiver_id, amount } = requestResult.rows[0];

    // 2. Validar que el usuario autenticado sea el receptor
    if (receiver_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tienes permiso para aceptar esta solicitud' });
    }

    // 3. Validar saldo suficiente 
    const balanceResult = await client.query('SELECT balance FROM users WHERE id = $1', [receiver_id]);
    const balanceRaw = balanceResult.rows[0].balance;
    const amountRaw = amount;
    const balance = Number(balanceRaw);
    const amountNum = Number(amountRaw);

    console.log('Comparando saldo en backend:', balance, typeof balance, 'con amount:', amountNum, typeof amountNum);

    if (isNaN(balance) || isNaN(amountNum)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo o monto inválido en el backend' });
    }

    if (balance < amountNum) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Saldo insuficiente para aceptar la solicitud (saldo: ${balance}, monto: ${amountNum})` });
    }

    // 4. Realizar la transferencia
    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amountNum, receiver_id]);
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amountNum, requester_id]);

    // 5. Actualizar estado de la solicitud
    await client.query('UPDATE payment_requests SET status = \'accepted\' WHERE id = $1', [requestId]);

    // 6. Registrar la transacción
    await client.query(
      'INSERT INTO transactions (sender_id, receiver_id, amount) VALUES ($1, $2, $3)',
      [receiver_id, requester_id, amountNum]
    );

    await client.query('COMMIT');
    res.json({ message: 'Solicitud aceptada y pago realizado' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al aceptar solicitud:', err);
    res.status(500).json({ error: 'Error al aceptar la solicitud' });
  } finally {
    client.release();
  }
};


// ================================================
// RECHAZAR SOLICITUD DE PAGO
// ================================================
exports.rejectPaymentRequest = async (req, res) => {
  const userId = req.user.userId;
  const { requestId } = req.params;

  try {
    // 1. Validar que la solicitud existe y está pendiente
    const requestResult = await pool.query(
      'SELECT receiver_id FROM payment_requests WHERE id = $1 AND status = \'pending\'',
      [requestId]
    );
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }
    if (requestResult.rows[0].receiver_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para rechazar esta solicitud' });
    }

    // 2. Actualizar estado a 'rejected'
    await pool.query('UPDATE payment_requests SET status = \'rejected\' WHERE id = $1', [requestId]);
    res.json({ message: 'Solicitud rechazada' });
  } catch (err) {
    console.error('Error al rechazar solicitud:', err);
    res.status(500).json({ error: 'Error al rechazar la solicitud' });
  }
};

// ================================================
// HISTORIAL DE SOLICITUDES DE PAGO (ENVIADAS Y RECIBIDAS)
// ================================================
exports.getAllPaymentRequests = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT 
        pr.id, 
        pr.amount, 
        pr.status,
        pr.created_at, 
        u1.name AS requester_name, 
        u1.email AS requester_email,
        u2.name AS receiver_name,
        u2.email AS receiver_email
       FROM payment_requests pr
       JOIN users u1 ON pr.requester_id = u1.id
       JOIN users u2 ON pr.receiver_id = u2.id
       WHERE pr.requester_id = $1 OR pr.receiver_id = $1
       ORDER BY pr.created_at DESC`,
      [userId]
    );
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Error al obtener historial de solicitudes:', err);
    res.status(500).json({ error: 'Error al obtener historial de solicitudes de pago' });
  }
};











