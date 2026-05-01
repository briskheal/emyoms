module.exports = (sequelize, DataTypes) => {
    const Batch = sequelize.define('Batch', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        batchNo: { type: DataTypes.STRING, allowNull: false },
        mfgDate: DataTypes.STRING,
        expDate: DataTypes.STRING,
        mrp: { type: DataTypes.FLOAT, defaultValue: 0 },
        pts: { type: DataTypes.FLOAT, defaultValue: 0 },
        ptr: { type: DataTypes.FLOAT, defaultValue: 0 },
        qtyAvailable: { type: DataTypes.INTEGER, defaultValue: 0 },
        productId: {
            type: DataTypes.INTEGER,
            references: { model: 'Products', key: 'id' }
        }
    });

    Batch.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return Batch;
};
