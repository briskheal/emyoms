const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const pg = require('pg');

// Force DECIMAL/NUMERIC fields to be returned as numbers instead of strings
// OID 1700 is the Postgres type ID for NUMERIC/DECIMAL
pg.types.setTypeParser(1700, function(val) {
    return val === null ? null : parseFloat(val);
});

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.Company = require('./company')(sequelize, DataTypes);
db.Product = require('./product')(sequelize, DataTypes);
db.Batch = require('./batch')(sequelize, DataTypes);
db.Stockist = require('./stockist')(sequelize, DataTypes);
db.Order = require('./order')(sequelize, DataTypes);
db.OrderItem = require('./orderItem')(sequelize, DataTypes);
db.Category = require('./category')(sequelize, DataTypes);
db.Group = require('./group')(sequelize, DataTypes);
db.HSN = require('./hsn')(sequelize, DataTypes);
db.GST = require('./gst')(sequelize, DataTypes);
db.HQ = require('./hq')(sequelize, DataTypes);
db.Invoice = require('./invoice')(sequelize, DataTypes);
db.InvoiceItem = require('./invoiceItem')(sequelize, DataTypes);
db.PurchaseEntry = require('./purchaseEntry')(sequelize, DataTypes);
db.FinancialNote = require('./financialNote')(sequelize, DataTypes);
db.Payment = require('./payment')(sequelize, DataTypes);
db.ExpenseCategory = require('./expenseCategory')(sequelize, DataTypes);
db.Expense = require('./expense')(sequelize, DataTypes);
db.Media = require('./media')(sequelize, DataTypes);
db.PurchaseItem = require('./purchaseItem')(sequelize, DataTypes);
db.NoteItem = require('./noteItem')(sequelize, DataTypes);
db.PDCNClaim = require('./pdcnClaim')(sequelize, DataTypes);
db.PDCNClaimItem = require('./pdcnClaimItem')(sequelize, DataTypes);

// Define Relationships
db.Product.hasMany(db.Batch, { as: 'batches', foreignKey: 'productId' });
db.Batch.belongsTo(db.Product, { foreignKey: 'productId' });

db.Stockist.hasMany(db.Order, { foreignKey: 'stockistId' });
db.Order.belongsTo(db.Stockist, { foreignKey: 'stockistId' });

db.Order.hasMany(db.OrderItem, { as: 'items', foreignKey: 'orderId' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });

db.Order.hasOne(db.Invoice, { foreignKey: 'orderId' });
db.Invoice.belongsTo(db.Order, { foreignKey: 'orderId' });

db.Invoice.hasMany(db.InvoiceItem, { as: 'items', foreignKey: 'invoiceId' });
db.InvoiceItem.belongsTo(db.Invoice, { foreignKey: 'invoiceId' });
db.InvoiceItem.belongsTo(db.Product, { foreignKey: 'productId' });

db.Stockist.hasMany(db.Invoice, { foreignKey: 'stockistId' });
db.Invoice.belongsTo(db.Stockist, { foreignKey: 'stockistId' });

db.Stockist.hasMany(db.FinancialNote, { foreignKey: 'stockistId' });
db.FinancialNote.belongsTo(db.Stockist, { foreignKey: 'stockistId' });

db.Stockist.hasMany(db.PDCNClaim, { foreignKey: 'stockistId' });
db.PDCNClaim.belongsTo(db.Stockist, { foreignKey: 'stockistId' });

db.PDCNClaim.hasMany(db.PDCNClaimItem, { as: 'items', foreignKey: 'pdcnClaimId' });
db.PDCNClaimItem.belongsTo(db.PDCNClaim, { foreignKey: 'pdcnClaimId' });

db.Stockist.hasMany(db.PurchaseEntry, { as: 'purchases', foreignKey: 'supplierId' });
db.PurchaseEntry.belongsTo(db.Stockist, { as: 'Supplier', foreignKey: 'supplierId' });

db.Stockist.hasMany(db.Payment, { foreignKey: 'stockistId' });
db.Payment.belongsTo(db.Stockist, { foreignKey: 'stockistId' });

db.ExpenseCategory.hasMany(db.Expense, { foreignKey: 'categoryId' });
db.Expense.belongsTo(db.ExpenseCategory, { foreignKey: 'categoryId' });

db.PurchaseEntry.hasMany(db.PurchaseItem, { as: 'items', foreignKey: 'purchaseEntryId' });
db.PurchaseItem.belongsTo(db.PurchaseEntry, { foreignKey: 'purchaseEntryId' });

db.FinancialNote.hasMany(db.NoteItem, { as: 'items', foreignKey: 'financialNoteId' });
db.NoteItem.belongsTo(db.FinancialNote, { foreignKey: 'financialNoteId' });

module.exports = db;
