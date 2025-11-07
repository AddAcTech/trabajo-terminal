import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.config.js";
import User from "./user.model.js";

const Image = sequelize.define(
  "Image",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    extraCols: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    extraRows: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Define relationship
User.hasMany(Image, { foreignKey: "userId" });
Image.belongsTo(User, { foreignKey: "userId" });

export default Image;
