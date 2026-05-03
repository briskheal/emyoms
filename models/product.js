module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        manufacturer: { type: DataTypes.STRING, defaultValue: "" },
        hsn: DataTypes.STRING,
        category: { type: DataTypes.STRING, defaultValue: "GENERAL" },
        group: { type: DataTypes.STRING, defaultValue: "GENERAL" },
        packing: DataTypes.STRING,
        mrp: { type: DataTypes.FLOAT, defaultValue: 0 },
        ptr: { type: DataTypes.FLOAT, defaultValue: 0 },
        pts: { type: DataTypes.FLOAT, defaultValue: 0 },
        gstPercent: { type: DataTypes.FLOAT },
        qtyAvailable: { type: DataTypes.INTEGER, defaultValue: 0 },
        active: { type: DataTypes.BOOLEAN, defaultValue: true },
        bonusBuy: { type: DataTypes.INTEGER, defaultValue: 0 },
        bonusGet: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        indexes: [
            { fields: ['name'] },
            { fields: ['category'] }
        ]
    });

    Product.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return Product;
};
