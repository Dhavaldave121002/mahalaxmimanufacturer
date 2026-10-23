export async function ensureRestockSubscriptionsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_restock_subscriptions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      customer_email VARCHAR(254) NOT NULL,
      status ENUM('PENDING', 'SENDING', 'SENT') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notified_at TIMESTAMP NULL DEFAULT NULL,
      UNIQUE KEY uq_product_restock_email (product_id, customer_email),
      INDEX idx_restock_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function sendRestockEmail({ email, productName, productUrl }) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
  const templateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || 'G6gT9XDN4SFBz6oqW';
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: email,
      to_name: 'Valued Customer',
      user_email: email,
      user_name: 'Valued Customer',
      subject: `${productName} is back in stock - Mahalaxmi Enterprises`,
      headline: 'Good news! It is back in stock',
      code_box: '',
      subtext: 'You asked us to let you know when this product was available.',
      items_block: productName,
      message: `${productName} is back in stock. View the product and place your order: ${productUrl}`
    }
  };
  if (privateKey) payload.accessToken = privateKey;

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://mahalaxmimanufacturer.com'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    const providerError = await response.text();
    throw new Error(`Email provider rejected restock alert (${response.status}): ${providerError.slice(0, 300)}`);
  }
}

export async function notifyRestockSubscribers(pool, productId) {
  await ensureRestockSubscriptionsTable(pool);
  const connection = await pool.getConnection();
  let subscribers = [];
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT id, customer_email
       FROM product_restock_subscriptions
       WHERE product_id = ? AND status = 'PENDING'
       FOR UPDATE`,
      [productId]
    );
    subscribers = rows;
    if (subscribers.length > 0) {
      const ids = subscribers.map(subscriber => subscriber.id);
      await connection.query(
        `UPDATE product_restock_subscriptions SET status = 'SENDING'
         WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'PENDING'`,
        ids
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  if (subscribers.length === 0) return 0;

  const [products] = await pool.query(
    'SELECT name, slug FROM products WHERE id = ? LIMIT 1',
    [productId]
  );
  if (!products[0]) {
    await pool.query(
      `UPDATE product_restock_subscriptions SET status = 'PENDING'
       WHERE product_id = ? AND status = 'SENDING'`,
      [productId]
    );
    return 0;
  }

  let deliveredCount = 0;
  const product = products[0];
  const productUrl = `https://mahalaxmimanufacturer.com/product/${encodeURIComponent(product.slug)}`;
  for (const subscriber of subscribers) {
    try {
      await sendRestockEmail({
        email: subscriber.customer_email,
        productName: product.name,
        productUrl
      });
      await pool.query(
        `UPDATE product_restock_subscriptions
         SET status = 'SENT', notified_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'SENDING'`,
        [subscriber.id]
      );
      deliveredCount += 1;
    } catch (error) {
      console.error(`Restock notification delivery failed for subscription ${subscriber.id}:`, error.message);
      await pool.query(
        `UPDATE product_restock_subscriptions SET status = 'PENDING'
         WHERE id = ? AND status = 'SENDING'`,
        [subscriber.id]
      );
    }
  }
  return deliveredCount;
}
