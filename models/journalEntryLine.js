module.exports = (sequelize, DataTypes) => {
    return sequelize.define('JournalEntryLine', {
        type: { type: DataTypes.ENUM('DR', 'CR'), allowNull: false },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        // Polymorphic associations for flexibility in accounting
        entityType: { type: DataTypes.STRING, allowNull: false }, // e.g. 'Stockist', 'ExpenseCategory', 'Bank', 'SystemLedger'
        entityId: { type: DataTypes.INTEGER, allowNull: true },
        entityName: { type: DataTypes.STRING, allowNull: false }, // Store name directly for easy viewing
        notes: { type: DataTypes.STRING, allowNull: true }
    });
};
