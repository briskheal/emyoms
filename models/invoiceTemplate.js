module.exports = (sequelize, DataTypes) => {
    return sequelize.define('InvoiceTemplate', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        stockistId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        anchorKeyword: {
            type: DataTypes.STRING,
            defaultValue: 'HSN'
        },
        colProductStart: { type: DataTypes.FLOAT, allowNull: false },
        colProductEnd: { type: DataTypes.FLOAT, allowNull: false },
        colHSNStart: { type: DataTypes.FLOAT, allowNull: false },
        colHSNEnd: { type: DataTypes.FLOAT, allowNull: false },
        colBatchStart: { type: DataTypes.FLOAT, allowNull: false },
        colBatchEnd: { type: DataTypes.FLOAT, allowNull: false },
        colExpStart: { type: DataTypes.FLOAT, allowNull: false },
        colExpEnd: { type: DataTypes.FLOAT, allowNull: false },
        colMRPStart: { type: DataTypes.FLOAT, allowNull: false },
        colMRPEnd: { type: DataTypes.FLOAT, allowNull: false },
        colRateStart: { type: DataTypes.FLOAT, allowNull: false },
        colRateEnd: { type: DataTypes.FLOAT, allowNull: false },
        colQtyStart: { type: DataTypes.FLOAT, allowNull: false },
        colQtyEnd: { type: DataTypes.FLOAT, allowNull: false }
    }, {
        tableName: 'InvoiceTemplates',
        timestamps: true
    });
};
