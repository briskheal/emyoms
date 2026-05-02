module.exports = (sequelize, DataTypes) => {
    const PurchaseItem = sequelize.define('PurchaseItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        purchaseEntryId: { type: DataTypes.INTEGER },
        productId: { type: DataTypes.INTEGER },
        name: { type: DataTypes.STRING },
        manufacturer: { type: DataTypes.STRING },
        batch: { type: DataTypes.STRING },
        mfgDate: { type: DataTypes.STRING },
        expDate: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        bonusQty: { type: DataTypes.INTEGER, defaultValue: 0 },
        purchaseRate: { type: DataTypes.DECIMAL(15, 2) },
        gstPercent: { type: DataTypes.DECIMAL(5, 2) },
        hsn: { type: DataTypes.STRING },
        totalValue: { type: DataTypes.DECIMAL(15, 2) }
    });
    return PurchaseItem;
};
