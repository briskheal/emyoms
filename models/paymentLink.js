module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PaymentLink', {
        paymentId: { type: DataTypes.INTEGER, allowNull: false },
        invoiceId: { type: DataTypes.INTEGER, allowNull: true },
        purchaseEntryId: { type: DataTypes.INTEGER, allowNull: true },
        amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
    });
};
