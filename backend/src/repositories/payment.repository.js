const { pool } = require('../config/db');

async function create({ order_id, amount, vnp_txn_ref }) {
  const [result] = await pool.execute(
    `INSERT INTO payments (order_id, amount, vnp_txn_ref, status) VALUES (?, ?, ?, 'pending')`,
    [order_id, amount, vnp_txn_ref]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByTxnRef(vnp_txn_ref) {
  const [rows] = await pool.execute('SELECT * FROM payments WHERE vnp_txn_ref = ?', [vnp_txn_ref]);
  return rows[0] || null;
}

async function updateByTxnRef(vnp_txn_ref, {
  status, vnp_transaction_no, vnp_bank_code, vnp_pay_date, vnp_response_code, raw_response,
}) {
  await pool.execute(
    `UPDATE payments SET
       status              = ?,
       vnp_transaction_no  = ?,
       vnp_bank_code       = ?,
       vnp_pay_date        = ?,
       vnp_response_code   = ?,
       raw_response        = ?
     WHERE vnp_txn_ref = ?`,
    [
      status,
      vnp_transaction_no  || null,
      vnp_bank_code       || null,
      vnp_pay_date        || null,
      vnp_response_code   || null,
      raw_response ? JSON.stringify(raw_response) : null,
      vnp_txn_ref,
    ]
  );
  return findByTxnRef(vnp_txn_ref);
}

module.exports = { create, findById, findByTxnRef, updateByTxnRef };
