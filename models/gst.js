module.exports = (sequelize, DataTypes) => {
    return sequelize.define('GST', { rate: { type: DataTypes.DECIMAL(5, 2), unique: true } });
};
