module.exports = (sequelize, DataTypes) => {
    const InvoiceItem = sequelize.define('InvoiceItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        invoiceId: { type: DataTypes.INTEGER },
        productId: { type: DataTypes.INTEGER },
        name: { type: DataTypes.STRING },
        batch: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        bonusQty: { type: DataTypes.INTEGER, defaultValue: 0 },
        priceUsed: { type: DataTypes.DECIMAL(15, 2) },
        mrp: { type: DataTypes.DECIMAL(15, 2) },
        totalValue: { type: DataTypes.DECIMAL(15, 2) },
        gstPercent: { type: DataTypes.DECIMAL(5, 2) },
        hsn: { type: DataTypes.STRING }
    });
    return InvoiceItem;
};
