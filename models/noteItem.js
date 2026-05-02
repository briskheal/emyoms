module.exports = (sequelize, DataTypes) => {
    const NoteItem = sequelize.define('NoteItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        financialNoteId: { type: DataTypes.INTEGER },
        productId: { type: DataTypes.INTEGER },
        name: { type: DataTypes.STRING },
        manufacturer: { type: DataTypes.STRING },
        batchNo: { type: DataTypes.STRING },
        expDate: { type: DataTypes.STRING },
        qty: { type: DataTypes.INTEGER },
        price: { type: DataTypes.DECIMAL(15, 2) },
        gstPercent: { type: DataTypes.DECIMAL(5, 2) },
        hsn: { type: DataTypes.STRING },
        totalValue: { type: DataTypes.DECIMAL(15, 2) }
    });
    return NoteItem;
};
