module.exports = (sequelize, DataTypes) => {
    return sequelize.define('OrderItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        manufacturer: DataTypes.STRING,
        batch: DataTypes.STRING,
        mfgDate: DataTypes.STRING,
        expDate: DataTypes.STRING,
        qty: DataTypes.INTEGER,
        bonusQty: { type: DataTypes.INTEGER, defaultValue: 0 },
        priceUsed: DataTypes.FLOAT,
        askingRate: DataTypes.FLOAT,
        masterRate: DataTypes.FLOAT,
        negotiationNote: DataTypes.TEXT,
        totalValue: DataTypes.FLOAT,
        orderId: {
            type: DataTypes.INTEGER,
            references: { model: 'Orders', key: 'id' }
        },
        productId: {
            type: DataTypes.INTEGER,
            references: { model: 'Products', key: 'id' }
        }
    });
};
