module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
        invoiceNo: { type: DataTypes.STRING, unique: true },
        stockistId: { type: DataTypes.INTEGER },
        subTotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        gstAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        grandTotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        outstandingAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        status: { type: DataTypes.STRING, defaultValue: 'approved' },
        dueDate: { type: DataTypes.DATE }
    });

    Invoice.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return Invoice;
};
