import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaStar,
  FaThumbsUp,
  FaThumbsDown,
  FaMapMarkerAlt,
  FaHandshake,
  FaMoneyBill,
} from 'react-icons/fa';
import { GiVacuumCleaner } from 'react-icons/gi';
 
interface Review {
  ReviewID: number;
  ReviewerName: string;
  ReviewSubject: string;
  ReviewContent: string;
  ReviewDate: string;
  OverallRating: number;
  CleanlinessRating: number;
  LocationRating: number;
  ServiceRating: number;
  ValueRating: number;
  helpfulYes?: number;
  helpfulNo?: number;
}
 
interface Hotel {
  GlobalPropertyID: number;
  GlobalPropertyName: string;
  PropertyAddress1: string;
  PropertyZipPostal: string;
  city: {
    CityName: string;
    Country: string;
  };
  region: {
    PropertyStateProvinceName: string;
  };
}
 
const DetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
 
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3000/api/hotels/${id}/details?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHotel(res.data.data.hotel);
        setReviews(res.data.data.reviews);
        setHasMore(res.data.pagination.hasNextPage);
      } catch (error) {
        console.error('Error loading details:', error);
      }
    };
    fetchDetails();
  }, [id, page]);
 
  const calculateAverages = () => {
    const avg = (key: keyof Review) => {
      const validValues = reviews.map(r => Number(r[key])).filter(val => !isNaN(val));
      return validValues.length
        ? (validValues.reduce((sum, val) => sum + val, 0) / validValues.length).toFixed(1)
        : '-';
    };
    return {
      overall: avg('OverallRating'),
      cleanliness: avg('CleanlinessRating'),
      location: avg('LocationRating'),
      service: avg('ServiceRating'),
      value: avg('ValueRating'),
    };
  };
 
  const ratings = calculateAverages();
 
  return (
    <div className="flex flex-col min-h-screen pt-20 px-6">
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto py-10">
          {hotel && (
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 text-white">{hotel.GlobalPropertyName}</h1>
              <p className="text-gray-300 text-sm mb-1">
                {hotel.PropertyAddress1}, {hotel.city.CityName}, {hotel.region.PropertyStateProvinceName},{' '}
                {hotel.city.Country}, {hotel.PropertyZipPostal}
              </p>
 
              <div className="flex flex-wrap gap-6 text-sm mt-2 text-gray-200 items-center">
                <p className="flex items-center gap-1">
                  <FaStar className="text-yellow-400" /> Overall: {ratings.overall}
                </p>
                <p className="flex items-center gap-1">
                  <GiVacuumCleaner className="text-pink-400" /> Cleanliness: {ratings.cleanliness}
                </p>
                <p className="flex items-center gap-1">
                  <FaMapMarkerAlt className="text-purple-400" /> Location: {ratings.location}
                </p>
                <p className="flex items-center gap-1">
                  <FaHandshake className="text-green-400" /> Service: {ratings.service}
                </p>
                <p className="flex items-center gap-1">
                  <FaMoneyBill className="text-blue-400" /> Value: {ratings.value}
                </p>
              </div>
            </div>
          )}
 
          {/* Placeholder for future review form */}
          <div className="mt-8 bg-gray-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-white">Leave a Review</h2>
            <p className="text-sm text-gray-400">* This section is for future use.</p>
          </div>
 
          {/* Reviews Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6 text-white">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-400">No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.ReviewID} className="bg-gray-800 p-5 mb-6 rounded shadow">
                  <h3 className="font-semibold text-lg mb-1 text-white">{review.ReviewSubject}</h3>
                  <p className="text-sm text-gray-400 mb-1">
                    by {review.ReviewerName} on {new Date(review.ReviewDate).toLocaleDateString()}
                  </p>
 
                  <p className="flex items-center gap-2 text-yellow-400 mb-2">
                    {Array.from({ length: Math.round(review.OverallRating) }, (_, i) => (
                      <FaStar key={i} />
                    ))}
                    <span className="text-sm text-gray-300">({Number(review.OverallRating).toFixed(1)})</span>
                  </p>
 
                  <div className="flex gap-4 text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <GiVacuumCleaner className="text-pink-400" />
                      Cleanliness: {typeof review.CleanlinessRating === 'number' ? review.CleanlinessRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="text-purple-400" />
                      Location: {typeof review.LocationRating === 'number' ? review.LocationRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaHandshake className="text-green-400" />
                      Service: {typeof review.ServiceRating === 'number' ? review.ServiceRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMoneyBill className="text-blue-400" />
                      Value: {typeof review.ValueRating === 'number' ? review.ValueRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
 
                  <p className="text-sm text-gray-200 mb-2">{review.ReviewContent}</p>
 
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <FaThumbsUp /> {review.helpfulYes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaThumbsDown /> {review.helpfulNo ?? 0}
                    </span>
                  </div>
                </div>
              ))
            )}
 
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
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-gray-400 py-6">
        © 2025 Hotel Sparkling Awards. All rights reserved.
      </footer>
    </div>
  );
};
 
export default DetailsPage;