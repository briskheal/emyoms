module.exports = (sequelize, DataTypes) => {
    return sequelize.define('HSN', { code: { type: DataTypes.STRING, unique: true }, description: { type: DataTypes.STRING } });
};
