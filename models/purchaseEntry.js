module.exports = (sequelize, DataTypes) => {
    const PurchaseEntry = sequelize.define('PurchaseEntry', {
        purchaseNo: { type: DataTypes.STRING, unique: true },
        supplierId: { type: DataTypes.INTEGER },
        supplierInvoiceNo: { type: DataTypes.STRING },
        invoiceDate: { type: DataTypes.DATE },
        subTotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        gstAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        grandTotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        outstandingAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        remarks: { type: DataTypes.TEXT }
    });
    return PurchaseEntry;
};
