module.exports = (sequelize, DataTypes) => {
    return sequelize.define('JournalVoucher', {
        jvNo: { type: DataTypes.STRING, unique: true, allowNull: false },
        date: { type: DataTypes.DATEONLY, allowNull: false },
        narration: { type: DataTypes.TEXT, allowNull: true },
        totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
    });
};
