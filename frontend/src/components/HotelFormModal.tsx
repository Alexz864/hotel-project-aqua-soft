import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { type Hotel, type FormErrors, type HotelCreationRequest, type City, type StateProvince } from '../types';
import { apiService } from '../services/api';

interface HotelFormModalProps {
  isOpen: boolean;
  hotel: Hotel | null;
  onClose: () => void;
  onSubmit: (data: HotelCreationRequest) => Promise<void>;
}

const HotelFormModal: React.FC<HotelFormModalProps> = ({
  isOpen,
  hotel,
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [cities, setCities] = useState<City[]>([]);
  const [statesProvinces, setStatesProvinces] = useState<StateProvince[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [formData, setFormData] = useState<HotelCreationRequest>({
    GlobalPropertyName: '',
    GlobalChainCode: '',
    PropertyAddress1: '',
    PropertyAddress2: '',
    PrimaryAirportCode: '',
    CityID: 0,
    PropertyStateProvinceID: 0,
    PropertyZipPostal: '',
    PropertyPhoneNumber: '',
    PropertyFaxNumber: '',
    SabrePropertyRating: 0,
    PropertyLatitude: 0,
    PropertyLongitude: 0,
    SourceGroupCode: '',
    ManagerUsername: ''
  });

  //fetch cities and states/provinces when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const [citiesResponse, statesResponse] = await Promise.all([
        apiService.getCities(),
        apiService.getStatesProvinces()
      ]);

      if (citiesResponse.success && citiesResponse.data) {
        setCities(citiesResponse.data);
      }

      if (statesResponse.success && statesResponse.data) {
        setStatesProvinces(statesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  //update the form when hotel prop changes
  useEffect(() => {
    if (hotel) {
      setFormData({
        SourcePropertyID: hotel.SourcePropertyID || '',
        GlobalPropertyName: hotel.GlobalPropertyName || '',
        GlobalChainCode: hotel.GlobalChainCode || '',
        PropertyAddress1: hotel.PropertyAddress1 || '',
        PropertyAddress2: hotel.PropertyAddress2 || '',
        PrimaryAirportCode: hotel.PrimaryAirportCode || '',
        CityID: hotel.CityID || 0,
        PropertyStateProvinceID: hotel.PropertyStateProvinceID || 0,
        PropertyZipPostal: hotel.PropertyZipPostal || '',
        PropertyPhoneNumber: hotel.PropertyPhoneNumber || '',
        PropertyFaxNumber: hotel.PropertyFaxNumber || '',
        SabrePropertyRating: hotel.SabrePropertyRating || 0,
        PropertyLatitude: hotel.PropertyLatitude || 0,
        PropertyLongitude: hotel.PropertyLongitude || 0,
        SourceGroupCode: hotel.SourceGroupCode || '',
        ManagerUsername: hotel.ManagerUsername || ''
      });
    } else {
      //reset form for new hotel
      setFormData({
        GlobalPropertyName: '',
        GlobalChainCode: '',
        PropertyAddress1: '',
        PropertyAddress2: '',
        PrimaryAirportCode: '',
        CityID: 0,
        PropertyStateProvinceID: 0,
        PropertyZipPostal: '',
        PropertyPhoneNumber: '',
        PropertyFaxNumber: '',
        SabrePropertyRating: 0,
        PropertyLatitude: 0,
        PropertyLongitude: 0,
        SourceGroupCode: '',
        ManagerUsername: ''
      });
    }
    setErrors({});
  }, [hotel, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.GlobalPropertyName.trim()) {
      newErrors.GlobalPropertyName = 'Property name is required';
    }
    if (!formData.GlobalChainCode.trim()) {
      newErrors.GlobalChainCode = 'Chain code is required';
    }
    if (!formData.PropertyAddress1.trim()) {
      newErrors.PropertyAddress1 = 'Address is required';
    }
    if (!formData.PrimaryAirportCode.trim()) {
      newErrors.PrimaryAirportCode = 'Airport code is required';
    }
    if (!hotel && (!formData.CityID || formData.CityID <= 0)) {
      newErrors.CityID = 'Please select a city';
    }
    if (!hotel && (!formData.PropertyStateProvinceID || formData.PropertyStateProvinceID <= 0)) {
      newErrors.PropertyStateProvinceID = 'Please select a state/province';
    }
    if (!formData.PropertyZipPostal.trim()) {
      newErrors.PropertyZipPostal = 'Zip/Postal code is required';
    }
    if (!formData.PropertyPhoneNumber.trim()) {
      newErrors.PropertyPhoneNumber = 'Phone number is required';
    }
    if (formData.SabrePropertyRating < 0 || formData.SabrePropertyRating > 5) {
      newErrors.SabrePropertyRating = 'Rating must be between 0 and 5';
    }
    if (!formData.PropertyLatitude || formData.PropertyLatitude < -90 || formData.PropertyLatitude > 90) {
      newErrors.PropertyLatitude = 'Valid latitude (-90 to 90) is required';
    }
    if (!formData.PropertyLongitude || formData.PropertyLongitude < -180 || formData.PropertyLongitude > 180) {
      newErrors.PropertyLongitude = 'Valid longitude (-180 to 180) is required';
    }
    if (!formData.SourceGroupCode.trim()) {
      newErrors.SourceGroupCode = 'Source group code is required';
    }
    // Manager username is required for new hotels based on your backend validation
    if (!hotel && (!formData.ManagerUsername || !formData.ManagerUsername.trim())) {
      newErrors.ManagerUsername = 'Manager username is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error: any) {
      setErrors({ 
        submit: error.response?.data?.error || error.response?.data?.message || 'An unexpected error occurred' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof HotelCreationRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {hotel ? 'Edit Hotel' : 'Add New Hotel'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="bg-red-900 border border-red-600 text-red-300 px-3 py-2 rounded text-sm">
              {errors.submit}
            </div>
          )}

          {/* Show SourcePropertyID only when editing */}
          {hotel && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Source Property ID</label>
              <input
                type="text"
                value={formData.SourcePropertyID || ''}
                disabled
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed"
                placeholder="Auto-generated"
              />
              <p className="mt-1 text-xs text-gray-400">This field cannot be modified</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Property Name</label>
            <input
              type="text"
              value={formData.GlobalPropertyName}
              onChange={(e) => updateField('GlobalPropertyName', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.GlobalPropertyName ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter property name"
            />
            {errors.GlobalPropertyName && <p className="mt-1 text-sm text-red-400">{errors.GlobalPropertyName}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Chain Code</label>
              <input
                type="text"
                value={formData.GlobalChainCode}
                onChange={(e) => updateField('GlobalChainCode', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.GlobalChainCode ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter chain code"
              />
              {errors.GlobalChainCode && <p className="mt-1 text-sm text-red-400">{errors.GlobalChainCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Airport Code</label>
              <input
                type="text"
                value={formData.PrimaryAirportCode}
                onChange={(e) => updateField('PrimaryAirportCode', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.PrimaryAirportCode ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter airport code"
              />
              {errors.PrimaryAirportCode && <p className="mt-1 text-sm text-red-400">{errors.PrimaryAirportCode}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Address Line 1</label>
            <input
              type="text"
              value={formData.PropertyAddress1}
              onChange={(e) => updateField('PropertyAddress1', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.PropertyAddress1 ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter address"
            />
            {errors.PropertyAddress1 && <p className="mt-1 text-sm text-red-400">{errors.PropertyAddress1}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              value={formData.PropertyAddress2}
              onChange={(e) => updateField('PropertyAddress2', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address line 2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!hotel && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                  {loadingLocations ? (
                    <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading cities...
                    </div>
                  ) : (
                    <select
                      value={formData.CityID || ''}
                      onChange={(e) => updateField('CityID', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.CityID ? 'border-red-500' : 'border-gray-600'
                      }`}
                    >
                      <option value="">Select a city</option>
                      {cities.map((city) => (
                        <option key={city.CityID} value={city.CityID}>
                          {city.CityName}, {city.Country}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.CityID && <p className="mt-1 text-sm text-red-400">{errors.CityID}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">State/Province</label>
                  {loadingLocations ? (
                    <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading states...
                    </div>
                  ) : (
                    <select
                      value={formData.PropertyStateProvinceID || ''}
                      onChange={(e) => updateField('PropertyStateProvinceID', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.PropertyStateProvinceID ? 'border-red-500' : 'border-gray-600'
                      }`}
                    >
                      <option value="">Select a state/province</option>
                      {statesProvinces.map((state) => (
                        <option key={state.PropertyStateProvinceID} value={state.PropertyStateProvinceID}>
                          {state.PropertyStateProvinceName}, {state.Country}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.PropertyStateProvinceID && <p className="mt-1 text-sm text-red-400">{errors.PropertyStateProvinceID}</p>}
                </div>
              </>
            )}

            <div className={!hotel ? '' : 'md:col-span-3'}>
              <label className="block text-sm font-medium text-gray-300 mb-1">Zip/Postal Code</label>
              <input
                type="text"
                value={formData.PropertyZipPostal}
                onChange={(e) => updateField('PropertyZipPostal', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.PropertyZipPostal ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Zip/Postal code"
              />
              {errors.PropertyZipPostal && <p className="mt-1 text-sm text-red-400">{errors.PropertyZipPostal}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.PropertyPhoneNumber}
                onChange={(e) => updateField('PropertyPhoneNumber', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.PropertyPhoneNumber ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter phone number"
              />
              {errors.PropertyPhoneNumber && <p className="mt-1 text-sm text-red-400">{errors.PropertyPhoneNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fax Number (Optional)</label>
              <input
                type="text"
                value={formData.PropertyFaxNumber}
                onChange={(e) => updateField('PropertyFaxNumber', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter fax number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rating (0-5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.SabrePropertyRating || ''}
                onChange={(e) => updateField('SabrePropertyRating', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.SabrePropertyRating ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="0.0"
              />
              {errors.SabrePropertyRating && <p className="mt-1 text-sm text-red-400">{errors.SabrePropertyRating}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.PropertyLatitude || ''}
                onChange={(e) => updateField('PropertyLatitude', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.PropertyLatitude ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Latitude (-90 to 90)"
              />
              {errors.PropertyLatitude && <p className="mt-1 text-sm text-red-400">{errors.PropertyLatitude}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.PropertyLongitude || ''}
                onChange={(e) => updateField('PropertyLongitude', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.PropertyLongitude ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Longitude (-180 to 180)"
              />
              {errors.PropertyLongitude && <p className="mt-1 text-sm text-red-400">{errors.PropertyLongitude}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Source Group Code</label>
              <input
                type="text"
                value={formData.SourceGroupCode}
                onChange={(e) => updateField('SourceGroupCode', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.SourceGroupCode ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter source group code"
              />
              {errors.SourceGroupCode && <p className="mt-1 text-sm text-red-400">{errors.SourceGroupCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Manager Username {!hotel && '(Required)'}</label>
              <input
                type="text"
                value={formData.ManagerUsername}
                onChange={(e) => updateField('ManagerUsername', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ManagerUsername ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter manager username"
              />
              {errors.ManagerUsername && <p className="mt-1 text-sm text-red-400">{errors.ManagerUsername}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {hotel ? 'Update Hotel' : 'Create Hotel'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelFormModal;