module.exports = (sequelize, DataTypes) => {
    return sequelize.define('GST', { rate: { type: DataTypes.INTEGER, unique: true } });
};
