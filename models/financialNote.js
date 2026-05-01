module.exports = (sequelize, DataTypes) => {
    const FinancialNote = sequelize.define('FinancialNote', {
        noteNo: { type: DataTypes.STRING, unique: true },
        noteType: { type: DataTypes.STRING }, // CN or DN
        stockistId: { type: DataTypes.INTEGER },
        amount: { type: DataTypes.DECIMAL(15, 2) },
        reason: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT }
    });
    return FinancialNote;
};
