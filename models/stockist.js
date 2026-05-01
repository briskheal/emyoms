module.exports = (sequelize, DataTypes) => {
    const Stockist = sequelize.define('Stockist', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        loginId: { type: DataTypes.STRING, allowNull: false, unique: true },
        password: { type: DataTypes.STRING, allowNull: false },
        address: DataTypes.TEXT,
        phone: DataTypes.STRING,
        email: DataTypes.STRING,
        dlNo: DataTypes.STRING,
        gstNo: DataTypes.STRING,
        fssaiNo: DataTypes.STRING,
        panNo: { type: DataTypes.STRING, allowNull: false },
        approved: { type: DataTypes.BOOLEAN, defaultValue: false },
        negotiatedPrices: { type: DataTypes.JSONB, defaultValue: [] },
        stockistCode: DataTypes.STRING,
        loginPin: DataTypes.STRING,
        partyType: { type: DataTypes.ENUM('STOCKIST', 'SUPPLIER'), defaultValue: 'STOCKIST' },
        creditLimit: { type: DataTypes.FLOAT, defaultValue: 0 },
        outstandingBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        pincode: DataTypes.STRING,
        hq: { type: DataTypes.STRING, defaultValue: "" }
    }, {
        indexes: [
            { fields: ['loginId'] },
            { fields: ['name'] }
        ]
    });

    Stockist.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return Stockist;
};
