module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Group', { name: { type: DataTypes.STRING, unique: true } });
};
