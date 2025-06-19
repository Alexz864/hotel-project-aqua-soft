import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import {
  FaStar, FaWifi, FaBed, FaUtensils, FaDumbbell,
  FaThumbsUp, FaThumbsDown, FaMapMarkerAlt,
  FaHandshake, FaMoneyBill, FaPen
} from "react-icons/fa";
import { GiVacuumCleaner } from "react-icons/gi";
import { useAuth } from "../contexts/AuthContext";
 
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
  InternetQuality: number;
  SleepQuality: number;
  FoodBeverage: number;
  AmenitiesRating: number;
  helpfulYes?: number;
  helpfulNo?: number;
}
 
interface Hotel {
  GlobalPropertyID: number;
  GlobalPropertyName: string;
  PropertyAddress1: string;
  PropertyZipPostal: string;
  city: { CityName: string; Country: string };
  region: { PropertyStateProvinceName: string };
}
 
const DetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
 
  const [likedReviews, setLikedReviews] = useState<number[]>([]);
  const [dislikedReviews, setDislikedReviews] = useState<number[]>([]);
 
  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem("likedReviews") || "[]");
    const disliked = JSON.parse(localStorage.getItem("dislikedReviews") || "[]");
    setLikedReviews(liked);
    setDislikedReviews(disliked);
  }, []);
 
  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3000/api/hotels/${id}/details?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHotel(res.data.data.hotel);
      let sorted = [...res.data.data.reviews];
      if (sortBy === "rating-high") sorted.sort((a, b) => b.OverallRating - a.OverallRating);
      else if (sortBy === "rating-low") sorted.sort((a, b) => a.OverallRating - b.OverallRating);
      else if (sortBy === "oldest") sorted.sort((a, b) => new Date(a.ReviewDate).getTime() - new Date(b.ReviewDate).getTime());
      else sorted.sort((a, b) => new Date(b.ReviewDate).getTime() - new Date(a.ReviewDate).getTime());
      setReviews(sorted);
      setHasMore(res.data.pagination.hasNextPage);
    } catch (err) {
      console.error("Error loading hotel details", err);
    }
  };
 
  useEffect(() => { fetchDetails(); }, [id, page, sortBy]);
 
  const calculateAverages = () => {
    const avg = (key: keyof Review) => {
      const values = reviews.map(r => Number(r[key])).filter(v => !isNaN(v));
      return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "0.0";
    };
    return {
      overall: avg("OverallRating"), cleanliness: avg("CleanlinessRating"),
      location: avg("LocationRating"), service: avg("ServiceRating"),
      value: avg("ValueRating"), internet: avg("InternetQuality"),
      sleep: avg("SleepQuality"), food: avg("FoodBeverage"), amenities: avg("AmenitiesRating")
    };
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in.");
    try {
      const { data: scores } = await axios.post("http://localhost:5001/analyze-review", { content });
      const token = localStorage.getItem("token") ?? "";
      await axios.post("http://localhost:3000/api/reviews", {
        HotelID: Number(id), ReviewerName: user.username, ReviewSubject: subject,
        ReviewContent: content, ReviewDate: new Date().toISOString(),
        OverallRating: scores.OverallRating, CleanlinessRating: scores.CleanlinessRate,
        LocationRating: scores.LocationRating, ServiceRating: scores.ServiceRating,
        ValueRating: scores.ValueRating, InternetQuality: scores.InternetQuality,
        SleepQuality: scores.SleepQuality, FoodBeverage: scores.FoodBeverage,
        AmenitiesRating: scores.AmenitiesRate
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSubject(""); setContent(""); setPage(1); fetchDetails();
    } catch (err) {
      console.error("Error submitting review", err);
    }
  };
 
  const handleEdit = async (reviewId: number) => {
    try {
      const token = localStorage.getItem("token") ?? "";
      await axios.put(
        `http://localhost:3000/api/reviews/${reviewId}`,
        { ReviewSubject: editSubject, ReviewContent: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditId(null); fetchDetails();
    } catch (err) {
      console.error("Failed to edit review", err);
    }
  };
 
  const handleLike = async (reviewId: number) => {
    const alreadyLiked = likedReviews.includes(reviewId);
    const updatedLikes = alreadyLiked
      ? likedReviews.filter(id => id !== reviewId)
      : [...likedReviews, reviewId];
 
    try {
      await axios.post(`http://localhost:3000/api/reviews/${reviewId}/like`, {
        action: alreadyLiked ? "remove" : "add"
      });
      setLikedReviews(updatedLikes);
      localStorage.setItem("likedReviews", JSON.stringify(updatedLikes));
      fetchDetails();
    } catch (err) {
      console.error("Error liking review", err);
    }
  };
 
  const handleDislike = async (reviewId: number) => {
    const alreadyDisliked = dislikedReviews.includes(reviewId);
    const updatedDislikes = alreadyDisliked
      ? dislikedReviews.filter(id => id !== reviewId)
      : [...dislikedReviews, reviewId];
 
    try {
      await axios.post(`http://localhost:3000/api/reviews/${reviewId}/dislike`, {
        action: alreadyDisliked ? "remove" : "add"
      });
      setDislikedReviews(updatedDislikes);
      localStorage.setItem("dislikedReviews", JSON.stringify(updatedDislikes));
      fetchDetails();
    } catch (err) {
      console.error("Error disliking review", err);
    }
  };
 
  const ratings = calculateAverages();
 
  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24">
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-6">
        {hotel && (
          <>
            <h1 className="text-4xl font-bold mb-2">{hotel.GlobalPropertyName}</h1>
            <p className="text-gray-300 text-sm mb-4">
              {hotel.PropertyAddress1}, {hotel.city.CityName}, {hotel.region.PropertyStateProvinceName}, {hotel.city.Country}, {hotel.PropertyZipPostal}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-2 text-sm text-gray-200">
              <p><FaStar className="inline text-yellow-400" /> Overall: {ratings.overall}</p>
              <p><GiVacuumCleaner className="inline text-pink-400" /> Cleanliness: {ratings.cleanliness}</p>
              <p><FaMapMarkerAlt className="inline text-purple-400" /> Location: {ratings.location}</p>
              <p><FaHandshake className="inline text-green-400" /> Service: {ratings.service}</p>
              <p><FaMoneyBill className="inline text-blue-400" /> Value: {ratings.value}</p>
              <p><FaWifi className="inline text-sky-400" /> Internet: {ratings.internet}</p>
              <p><FaBed className="inline text-indigo-400" /> Sleep: {ratings.sleep}</p>
              <p><FaUtensils className="inline text-orange-400" /> Food: {ratings.food}</p>
              <p><FaDumbbell className="inline text-lime-400" /> Amenities: {ratings.amenities}</p>
            </div>
          </>
        )}
 
        <div className="mt-10 bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-4">Leave a Review</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white" placeholder="Subject" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required className="w-full p-2 bg-gray-700 rounded text-white" placeholder="Review content" rows={5} />
            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded">Submit</button>
          </form>
        </div>
 
        <div className="mt-10">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold">Reviews</h2>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-700 text-white p-2 rounded">
              <option value="latest">Date: Newest</option>
              <option value="oldest">Date: Oldest</option>
              <option value="rating-high">Rating: Highest</option>
              <option value="rating-low">Rating: Lowest</option>
            </select>
          </div>
          {reviews.length === 0 ? (
            <p className="text-gray-400">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.ReviewID} className="bg-gray-800 p-5 mb-6 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    {editId === r.ReviewID ? (
                      <>
                        <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full p-2 bg-gray-700 mb-2 text-white rounded" />
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-2 bg-gray-700 text-white rounded" rows={4} />
                        <button onClick={() => handleEdit(r.ReviewID)} className="mt-2 bg-green-600 px-4 py-1 rounded">Save</button>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg mb-1">“{r.ReviewSubject}”</h3>
                        <p className="text-sm text-gray-400 mb-1">by {r.ReviewerName} on {new Date(r.ReviewDate).toLocaleDateString()}</p>
                        <p className="flex items-center gap-1 text-yellow-400 mb-2">
                          {Array.from({ length: Math.round(r.OverallRating) }, (_, i) => <FaStar key={i} />)}
                          <span className="text-gray-300 text-sm ml-2">({Number(r.OverallRating).toFixed(1)})</span>
                        </p>
                        <p className="text-sm text-gray-300 mb-3">{r.ReviewContent}</p>
                        {user?.username === r.ReviewerName && (
                          <button onClick={() => { setEditId(r.ReviewID); setEditSubject(r.ReviewSubject); setEditContent(r.ReviewContent); }} className="text-blue-400"><FaPen /></button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-3 items-center text-sm text-gray-400 ml-4 mt-2">
                    <button onClick={() => handleLike(r.ReviewID)} className={`flex items-center gap-1 ${likedReviews.includes(r.ReviewID) ? "text-green-400" : "hover:text-green-400"}`}>
                      <FaThumbsUp /> {r.helpfulYes ?? 0}
                    </button>
                    <button onClick={() => handleDislike(r.ReviewID)} className={`flex items-center gap-1 ${dislikedReviews.includes(r.ReviewID) ? "text-red-400" : "hover:text-red-400"}`}>
                      <FaThumbsDown /> {r.helpfulNo ?? 0}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-center gap-4 mt-6">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Previous</button>
            <span className="self-center">Page {page}</span>
            <button disabled={!hasMore} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
      <footer className="mt-12 text-center text-sm text-gray-500 pb-6">© 2025 Hotel Booking. All rights reserved.</footer>
    </div>
  );
};

export default DetailsPage;