import Sequelize from "sequelize";
import sequelize from "../config/sequelize.config.js";
import User from "./user.model.js";
import Image from "./image.model.js";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = User;
db.Image = Image;

export default db;
