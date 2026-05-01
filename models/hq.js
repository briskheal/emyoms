module.exports = (sequelize, DataTypes) => {
    return sequelize.define('HQ', { name: { type: DataTypes.STRING, unique: true } });
};
