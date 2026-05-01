module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Expense', {
        expenseNo: { type: DataTypes.STRING, unique: true },
        categoryId: { type: DataTypes.INTEGER },
        title: { type: DataTypes.STRING },
        amount: { type: DataTypes.DECIMAL(15, 2) },
        date: { type: DataTypes.DATE },
        paymentMethod: { type: DataTypes.STRING }
    });
};
