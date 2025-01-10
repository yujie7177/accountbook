import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 启用 CORS
app.use('*', cors());

// 获取当月花销记录
app.get('/api/expenses', async (c) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 月份从 0 开始，需要加 1
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY id DESC'
  )
    .bind(startDate, endDate)
    .all();
  return c.json(results);
});

// 获取畅的当月花销记录
app.get('/api/expenses/chang', async (c) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE user = "畅" AND date >= ? AND date <= ?  ORDER BY id DESC'
  )
    .bind(startDate, endDate)
    .all();
  return c.json(results);
});

// 获取杰的当月花销记录
app.get('/api/expenses/jie', async (c) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE user = "杰" AND date >= ? AND date <= ? ORDER BY id DESC'
  )
    .bind(startDate, endDate)
    .all();
  return c.json(results);
});

// 添加新的花销记录
app.post('/api/expenses', async (c) => {
  const { date, category, paymentMethod, amount, user } = await c.req.json();

  // 插入数据
  await c.env.DB.prepare(
    'INSERT INTO expenses (date, category, paymentMethod, amount, user) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(date, category, paymentMethod, amount, user)
    .run();

  return c.json({ success: true });
});

// 获取当月汇总数据
app.get('/api/summary', async (c) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

  // 畅和杰的当月总花销
  const totalChang = await c.env.DB.prepare(
    'SELECT SUM(amount) as total FROM expenses WHERE user = "畅" AND date >= ? AND date <= ?'
  )
    .bind(startDate, endDate)
    .first();
  const totalJie = await c.env.DB.prepare(
    'SELECT SUM(amount) as total FROM expenses WHERE user = "杰" AND date >= ? AND date <= ?'
  )
    .bind(startDate, endDate)
    .first();

  // 消费品类汇总
  const categories = await c.env.DB.prepare(
    'SELECT category, SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ? GROUP BY category'
  )
    .bind(startDate, endDate)
    .all();

  // 支付方式汇总
  const paymentMethods = await c.env.DB.prepare(
    'SELECT paymentMethod, SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ? GROUP BY paymentMethod'
  )
    .bind(startDate, endDate)
    .all();

  return c.json({
    totalChang: totalChang?.total || 0,
    totalJie: totalJie?.total || 0,
    categories: categories.results,
    paymentMethods: paymentMethods.results,
  });
});

export default app;