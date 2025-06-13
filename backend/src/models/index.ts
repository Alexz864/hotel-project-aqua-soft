import sequelize from "../config/database";
import Hotel from "./Hotel";
import City from "./City";
import Region from "./Region";
import Review from "./Review";
import Role from "./Role";
import User from "./User";
import Permission from "./Permission";

const db = {
    sequelize,
    Hotel,
    City,
    Region,
    Review,
    Role,
    User,
    Permission
};

export default db;