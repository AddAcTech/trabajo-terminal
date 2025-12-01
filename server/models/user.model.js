import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.config.js";

const User = sequelize.define(
  "User",
  {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mainKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    useUniqueKey: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    }
  },
  {
    timestamps: true,
  }
);

export default User;
