import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { type Hotel, type HotelCreationRequest } from '../types';
import HotelFormModal from '../components/HotelFormModal';
import HotelsTable from '../components/HotelsTable';

const HotelsManagementPage: React.FC = () => {
  //hotels state and logic
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  //modal and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  //fetch hotels function
  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:3000/api/hotels-with-reviews-and-managers?page=${currentPage}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setHotels(res.data.data);
      const hasMore = res.data.data.length === 10;
      setTotalPages(hasMore ? currentPage + 1 : currentPage);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHotel = async (hotelData: HotelCreationRequest): Promise<void> => {
    const result = await apiService.createHotel(hotelData);
    if (result.success) {
      await fetchHotels();
    } else {
      throw new Error(result.error || 'Failed to create hotel');
    }
  };

  const updateHotel = async (id: number, hotelData: HotelCreationRequest): Promise<void> => {
    const result = await apiService.updateHotel(id, hotelData);
    if (result.success) {
      await fetchHotels();
    } else {
      throw new Error(result.error || 'Failed to update hotel');
    }
  };

  const deleteHotel = async (hotelId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) {
      return;
    }

    try {
      const result = await apiService.deleteHotel(hotelId);
      if (result.success) {
        await fetchHotels();
      } else {
        alert(result.error || 'Failed to delete hotel');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'An unexpected error occurred');
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleOpenModal = (hotel?: any) => {
    if (hotel) {
      ////fetch hotel details for edit
      fetchFullHotelDetails(hotel.id);
    } else {
      setEditingHotel(null);
      setShowModal(true);
    }
  };

  const fetchFullHotelDetails = async (hotelId: number) => {
    try {
      const response = await apiService.getHotelById(hotelId);
      if (response.success && response.data) {
        setEditingHotel(response.data);
        setShowModal(true);
      } else {
        alert('Hotel details not found for editing');
      }
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      alert('Failed to load hotel details for editing');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHotel(null);
  };

  const handleSubmit = async (data: HotelCreationRequest) => {
    if (editingHotel) {
      await updateHotel(editingHotel.GlobalPropertyID, data);
    } else {
      await createHotel(data);
    }
  };

  //filter hotels based on search term
  const filteredHotels = hotels.filter(hotel =>
    hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Hotel Management</h1>
          <p className="text-gray-400">Manage hotels in the system</p>
        </div>

        {/* Search and Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search hotels..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Hotel
            </button>
          </div>
        </div>

        {/* Hotels Table */}
        <HotelsTable
          hotels={filteredHotels}
          loading={loading}
          onEdit={handleOpenModal}
          onDelete={deleteHotel}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Hotel Form Modal */}
        <HotelFormModal
          isOpen={showModal}
          hotel={editingHotel}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-400 py-6">
        © 2025 Hotel Sparkling Awards. All rights reserved.
      </footer>
    </div>
  );
};

export default HotelsManagementPage;