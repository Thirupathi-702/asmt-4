const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'order_matching',
  password: 'Thiru@6702',
  port: 5432,
});

app.post('/new-order', async (req, res) => {
  const { BuyerQty, BuyerPrice, SellerPrice, SellerQty } = req.body;

  // Validate input data
  if (
    BuyerQty == null || BuyerPrice == null || 
    SellerPrice == null || SellerQty == null ||
    isNaN(BuyerQty) || isNaN(BuyerPrice) || 
    isNaN(SellerPrice) || isNaN(SellerQty)
  ) {
    return res.status(400).json({ error: 'All fields are required and must be valid numbers' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const matchQuery = `
      SELECT * FROM PendingOrderTable 
      WHERE BuyerPrice = $1 AND SellerPrice = $2
      FOR UPDATE
    `;
    const result = await client.query(matchQuery, [SellerPrice, BuyerPrice]);

    if (result.rows.length > 0) {
      const order = result.rows[0];
      const minQty = Math.min(BuyerQty, SellerQty);

      const insertCompletedOrder = `
        INSERT INTO CompletedOrderTable (Price, Qty) VALUES ($1, $2)
      `;
      await client.query(insertCompletedOrder, [BuyerPrice, minQty]);

      const updatePendingOrder = `
        UPDATE PendingOrderTable SET 
        BuyerQty = BuyerQty - $1, 
        SellerQty = SellerQty - $2 
        WHERE id = $3
      `;
      await client.query(updatePendingOrder, [minQty, minQty, order.id]);

      if (order.BuyerQty - minQty <= 0 || order.SellerQty - minQty <= 0) {
        const deleteOrder = `DELETE FROM PendingOrderTable WHERE id = $1`;
        await client.query(deleteOrder, [order.id]);
      }
    } else {
      const insertPendingOrder = `
        INSERT INTO PendingOrderTable (BuyerQty, BuyerPrice, SellerPrice, SellerQty)
        VALUES ($1, $2, $3, $4)
      `;
      await client.query(insertPendingOrder, [BuyerQty, BuyerPrice, SellerPrice, SellerQty]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Order processed successfully' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error processing order:', e);
    res.status(500).json({ error: 'Failed to process order' });
  } finally {
    client.release();
  }
});


app.get('/pending-orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM PendingOrderTable');
    res.json(result.rows);
  } catch (e) {
    console.error('Error fetching pending orders:', e);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

app.get('/completed-orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM CompletedOrderTable');
    res.json(result.rows);
  } catch (e) {
    console.error('Error fetching completed orders:', e);
    res.status(500).json({ error: 'Failed to fetch completed orders' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
