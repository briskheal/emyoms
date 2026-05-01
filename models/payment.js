module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Payment', {
        paymentNo: { type: DataTypes.STRING, unique: true },
        stockistId: { type: DataTypes.INTEGER },
        amount: { type: DataTypes.DECIMAL(15, 2) },
        method: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING }, // RECEIPT or PAYMENT
        date: { type: DataTypes.DATE }
    });
};
