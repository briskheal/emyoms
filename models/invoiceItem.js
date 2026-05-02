module.exports = (sequelize, DataTypes) => {
    const InvoiceItem = sequelize.define('InvoiceItem', {
        productId: { type: DataTypes.INTEGER },
        name: { type: DataTypes.STRING },
        batch: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        rate: { type: DataTypes.DECIMAL(15, 2) },
        totalValue: { type: DataTypes.DECIMAL(15, 2) },
        gstPercent: { type: DataTypes.DECIMAL(5, 2) },
        hsn: { type: DataTypes.STRING }
    });
    return InvoiceItem;
};
