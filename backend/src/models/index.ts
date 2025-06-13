import sequelize from "../config/database";
import Hotel from "./Hotel";
import City from "./City";
import Region from "./Region";
import Review from "./Review";

const db = {
    sequelize,
    Hotel,
    City,
    Region,
    Review
};

export default db;