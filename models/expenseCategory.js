module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ExpenseCategory', { name: { type: DataTypes.STRING, unique: true } });
};
