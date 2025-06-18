import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
 
interface HotelProps {
  hotel: {
    id: number;
    name: string;
    city: string;
    rating: number;
    reviewCount: number;
  };
}
 
const HotelCard = ({ hotel }: HotelProps) => {
  return (
    <div className="bg-gray-800 text-white p-5 rounded-xl mb-6 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold mb-1">{hotel.name}</h2>
 
          <p className="flex items-center text-sm text-gray-300 mb-1">
            <FaMapMarkerAlt className="mr-2 text-blue-400" />
            {hotel.city}
          </p>
 
          <p className="flex items-center gap-2 text-sm mt-1">
            <FaStar className="text-yellow-400" />
            <span className="bg-green-600 text-white px-2 py-0.5 rounded text-sm font-medium">
              {hotel.rating.toFixed(1)}
            </span>
            <span className="text-gray-400 text-sm">
              from {hotel.reviewCount} reviews
            </span>
          </p>
        </div>
 
        <div>
          <Link to={`/hotels/${hotel.id}`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-1">
              Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
 
export default HotelCard;