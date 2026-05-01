module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        orderNo: { type: DataTypes.STRING, unique: true },
        stockistCode: DataTypes.STRING,
        subTotal: DataTypes.FLOAT,
        gstAmount: DataTypes.FLOAT,
        grandTotal: DataTypes.FLOAT,
        status: { type: DataTypes.STRING, defaultValue: 'pending' },
        hq: { type: DataTypes.STRING, defaultValue: "" },
        bonusApproval: { type: DataTypes.JSONB, defaultValue: {} },
        stockistId: {
            type: DataTypes.INTEGER,
            references: { model: 'Stockists', key: 'id' }
        }
    }, {
        indexes: [
            { fields: ['orderNo'] },
            { fields: ['status'] }
        ]
    });

    Order.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return Order;
};
