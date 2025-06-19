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
        const res = await axios.get("http://localhost:3000/api/hotels/manager", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseData = res.data?.data || res.data?.hotels || [];
        setHotels(responseData);
      } catch (error) {
        console.error("Failed to fetch hotels for manager:", error);
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
      <h1 className="text-3xl font-bold mb-8 text-center">
        {user.username}'s Assigned Hotels
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
              className="bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-xl transition duration-300"
            >
              <h2 className="text-xl font-bold text-teal-400 mb-2">{hotel.name}</h2>
              <p className="flex items-center text-sm text-gray-300 mb-2">
                <MdLocationCity className="mr-2 text-yellow-300" />
                {hotel.city}
              </p>

              <p className="text-sm text-gray-400 mb-2">
                <strong>Rating:</strong>{" "}
                {hotel.rating?.toFixed(1) || "N/A"} from {hotel.reviewCount || 0} reviews
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mt-4">
                <p className="flex items-center gap-2">
                  <FaPlane className="text-blue-400" />
                  Airport Distance: {hotel.DistanceToTheAirport ?? "N/A"} km
                </p>
                <p className="flex items-center gap-2">
                  <FaHotel className="text-green-400" />
                  Rooms: {hotel.RoomsNumber ?? "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  Stars: {hotel.HotelStars ?? "N/A"}
                </p>
                <p className="flex items-center gap-2">
                  <FaBuilding className="text-pink-400" />
                  Floors: {hotel.NumberOfFloors ?? "N/A"}
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
