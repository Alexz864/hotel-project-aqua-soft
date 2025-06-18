import { useEffect, useState } from "react";
import axios from "axios";
import HotelCard from "../components/HotelCard";

interface Hotel {
  id: number;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
}

const MainPage = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:3000/api/hotels-with-reviews?page=${page}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setHotels(res.data.data);
        setHasMore(res.data.data.length === 10);
      } catch (err) {
        console.error("Error fetching hotels:", err);
      }
    };

    fetchHotels();
  }, [page]);

  return (
    <div className="flex flex-col min-h-screen pt-20 px-6">
      <main className="flex-grow">
        <h1 className="text-xl font-bold mb-4 text-white"></h1>
        {hotels.length === 0 && <p className="text-white">No hotels found.</p>}
        {hotels.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}

        <div className="flex justify-center items-center gap-6 mt-8">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-white text-lg font-medium">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-gray-400 py-6">
        © 2025 Hotel Sparkling Awards. All rights reserved.
      </footer>
    </div>
  );
};

export default MainPage;
