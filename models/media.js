module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('Media', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING },
        url: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING }, // music, video, document
        createdAt: { type: DataTypes.DATE },
        updatedAt: { type: DataTypes.DATE }
    });

    Media.prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        values._id = values.id;
        return values;
    };

    return Media;
};
