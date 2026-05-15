module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Ledger', {
        name:           { type: DataTypes.STRING, allowNull: false, unique: true },
        group:          { type: DataTypes.STRING, allowNull: false }, // e.g. 'Bank', 'Cash', 'Capital', 'Loan', 'Tax Payable', 'Fixed Assets', 'Sundry Creditor'
        nature:         { type: DataTypes.ENUM('DR', 'CR'), defaultValue: 'DR' }, // DR = Asset, CR = Liability
        openingBalance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
        notes:          { type: DataTypes.STRING, allowNull: true }
    });
};
