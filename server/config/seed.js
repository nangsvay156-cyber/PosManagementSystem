require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Category } = require('../models');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

const dropAllTables = async () => {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await sequelize.query('DROP TABLE IF EXISTS activity_logs');
  await sequelize.query('DROP TABLE IF EXISTS sale_return_items');
  await sequelize.query('DROP TABLE IF EXISTS sale_returns');
  await sequelize.query('DROP TABLE IF EXISTS sale_items');
  await sequelize.query('DROP TABLE IF EXISTS sales');
  await sequelize.query('DROP TABLE IF EXISTS purchase_order_items');
  await sequelize.query('DROP TABLE IF EXISTS purchase_orders');
  await sequelize.query('DROP TABLE IF EXISTS stock_movements');
  await sequelize.query('DROP TABLE IF EXISTS products');
  await sequelize.query('DROP TABLE IF EXISTS customers');
  await sequelize.query('DROP TABLE IF EXISTS suppliers');
  await sequelize.query('DROP TABLE IF EXISTS categories');
  await sequelize.query('DROP TABLE IF EXISTS refresh_tokens');
  await sequelize.query('DROP TABLE IF EXISTS users');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ All tables dropped.');
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');

    await dropAllTables();

    await sequelize.sync();
    console.log('✅ Database synced (all tables recreated).');

    // ── Admin User ────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);

    const [admin, adminCreated] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        full_name: 'System Admin',
        email:     'admin@pos.local',
        username:  'admin',
        password:  hashedPassword,
        role:      'admin',
        is_active: 1,
      },
    });

    console.log(
      adminCreated
        ? '✅ Admin user created (admin / Admin@123)'
        : 'ℹ️  Admin user already exists'
    );

    // ── Default Category ──────────────────────────────────────
    const [category, categoryCreated] = await Category.findOrCreate({
      where: { name: 'General' },
      defaults: {
        name:        'General',
        description: 'Default product category',
        is_active:   1,
      },
    });

    console.log(
      categoryCreated
        ? '✅ Default category created (General)'
        : 'ℹ️  Default category already exists'
    );

    console.log('🌱 Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();