module.exports = (sequelize, DataTypes) => {
    const PDCNClaim = sequelize.define('PDCNClaim', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        stockistId: { type: DataTypes.INTEGER, allowNull: false },
        invoiceNo: { type: DataTypes.STRING, allowNull: false },
        totalAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        status: { 
            type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
            defaultValue: 'pending' 
        },
        adminRemarks: { type: DataTypes.TEXT }
    });

    PDCNClaim.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return PDCNClaim;
};
