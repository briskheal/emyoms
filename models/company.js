module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Company', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, defaultValue: "EMYRIS BIOLIFESCIENCES" },
        address: { type: DataTypes.TEXT, defaultValue: "" },
        websites: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        phones: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        tollFree: { type: DataTypes.STRING, defaultValue: "7993163300" },
        emails: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        superDistributorEmail: DataTypes.STRING,
        adminEmail: DataTypes.STRING,
        gstRate: { type: DataTypes.FLOAT, defaultValue: 12 },
        state: { type: DataTypes.STRING, defaultValue: "GUJARAT" },
        gstNo: { type: DataTypes.STRING, defaultValue: "" },
        panNo: { type: DataTypes.STRING, defaultValue: "" },
        dlNo: { type: DataTypes.STRING, defaultValue: "" },
        fssaiNo: { type: DataTypes.STRING, defaultValue: "" },
        bankDetails: { type: DataTypes.TEXT, defaultValue: "" },
        termsConditions: { type: DataTypes.TEXT, defaultValue: "" },
        invoiceTerms: { type: DataTypes.TEXT, defaultValue: "" },
        cnTerms: { type: DataTypes.TEXT, defaultValue: "" },
        dnTerms: { type: DataTypes.TEXT, defaultValue: "" },
        invoiceBankVisible: { type: DataTypes.BOOLEAN, defaultValue: true },
        scrollingMessage: { type: DataTypes.JSONB, defaultValue: {} },
        invoiceStyle: { type: DataTypes.STRING, defaultValue: 'classic' },
        documentCounters: { type: DataTypes.JSONB, defaultValue: {} }
    });
};
