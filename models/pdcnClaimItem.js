module.exports = (sequelize, DataTypes) => {
    const PDCNClaimItem = sequelize.define('PDCNClaimItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        pdcnClaimId: { type: DataTypes.INTEGER, allowNull: false },
        productId: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        billedPrice: { type: DataTypes.DECIMAL(15, 2) },
        specialPrice: { type: DataTypes.DECIMAL(15, 2) },
        saleDiff: { type: DataTypes.DECIMAL(15, 2) },
        stkMargin: { type: DataTypes.DECIMAL(15, 2) },
        finalPDCN: { type: DataTypes.DECIMAL(15, 2) },
        gstPercent: { type: DataTypes.DECIMAL(5, 2) },
        remarks: { type: DataTypes.TEXT }
    });

    return PDCNClaimItem;
};
