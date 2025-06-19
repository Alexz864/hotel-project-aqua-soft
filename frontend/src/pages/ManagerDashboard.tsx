import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { FaPlane, FaHotel, FaStar, FaBuilding } from "react-icons/fa";
import { MdLocationCity } from "react-icons/md";
 
interface Hotel {
  id: number;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  DistanceToTheAirport?: number;
  RoomsNumber?: number;
  HotelStars?: number;
  NumberOfFloors?: number;
}
 
const ManagerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await axios.get("http://localhost:3000/my-hotels", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
 
        setHotels(res.data.hotels || res.data);
      } catch (err) {
        console.error("Error fetching manager hotels:", err);
      } finally {
        setLoading(false);
      }
    };
 
    if (user?.role === "hotel_manager") {
      fetchHotels();
    }
  }, [user, token]);
 
  if (!user || user.role !== "hotel_manager") {
    return <Navigate to="/" replace />;
  }
 
  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 px-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {user?.username}'s Hotel Dashboard
      </h1>
 
      {loading ? (
        <p className="text-center text-gray-400">Loading hotels...</p>
      ) : hotels.length === 0 ? (
        <p className="text-center text-gray-400">No hotels assigned to you.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-gray-800 rounded-lg p-5 shadow-lg hover:shadow-xl transition duration-200"
            >
              <h2 className="text-2xl font-semibold mb-2 text-teal-400">{hotel.name}</h2>
              <p className="flex items-center gap-2 text-gray-300">
                <MdLocationCity className="text-yellow-300" /> City: {hotel.city}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                <strong>Rating:</strong> {hotel.rating?.toFixed(1) || "N/A"} from {hotel.reviewCount || 0} reviews
              </p>
 
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-300">
                <p className="flex items-center gap-2">
                  <FaPlane className="text-blue-400" /> Airport: {hotel.DistanceToTheAirport ?? "N/A"} km
                </p>
                <p className="flex items-center gap-2">
                  <FaHotel className="text-green-400" /> Rooms: {hotel.RoomsNumber ?? "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" /> Stars: {hotel.HotelStars ?? "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaBuilding className="text-pink-400" /> Floors: {hotel.NumberOfFloors ?? "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
 
export default ManagerDashboard;