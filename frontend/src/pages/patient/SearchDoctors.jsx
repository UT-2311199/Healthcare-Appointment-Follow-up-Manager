import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Star, Clock, Calendar,
  ChevronRight, Loader, AlertCircle, RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { SPECIALIZATIONS } from '../../utils/constants';
import toast from 'react-hot-toast';

// ─── Individual Doctor Card ───────────────────────────────────────────────────
function DoctorCard({ doctor }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm
                    hover:shadow-md transition-all duration-200 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center
                        justify-center text-blue-700 text-2xl font-bold flex-shrink-0">
          {doctor.name?.charAt(0) || 'D'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            Dr. {doctor.name}
          </h3>
          <p className="text-blue-600 text-sm font-medium mt-0.5">
            {doctor.specialization}
          </p>

          {/* Details row */}
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {doctor.slotDuration || 30} min slots
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {doctor.workingHours?.start || '09:00'} –{' '}
              {doctor.workingHours?.end   || '17:00'}
            </span>
            {doctor.fee > 0 && (
              <span className="text-xs text-gray-500">
                ${doctor.fee} / visit
              </span>
            )}
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= 4
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">4.0</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p className="text-sm text-gray-500 mt-3 line-clamp-2">{doctor.bio}</p>
      )}

      {/* Qualifications */}
      {doctor.qualifications?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {doctor.qualifications.slice(0, 4).map((q) => (
            <span
              key={q}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {q}
            </span>
          ))}
        </div>
      )}

      {/* Working days */}
      {doctor.workingDays?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((short, i) => {
            const full = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i];
            const works = doctor.workingDays.includes(full);
            return (
              <span
                key={short}
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  works
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-300'
                }`}
              >
                {short}
              </span>
            );
          })}
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={() => navigate(`/patient/book/${doctor._id}`)}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 style={{ color: 'var(--text-primary)' }}
                   py-2.5 rounded-lg text-sm font-medium transition-colors
                   flex items-center justify-center gap-2"
      >
        Book Appointment
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Search Page ─────────────────────────────────────────────────────────
export default function SearchDoctors() {
  const [doctors,        setDoctors]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [specialization, setSpecialization] = useState('');
  const [total,          setTotal]          = useState(0);

  // ── Fetch doctors ──────────────────────────────────────────────
  const fetchDoctors = useCallback(async (query = '', spec = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('search', query.trim());
      if (spec.trim())  params.append('specialization', spec.trim());

      console.log('Fetching doctors with params:', params.toString());

      const { data } = await api.get(`/doctors?${params.toString()}`);

      console.log('Doctors response:', data);

      if (data.success) {
        setDoctors(data.doctors || []);
        setTotal(data.total   || 0);
      } else {
        setError('Failed to load doctors');
        setDoctors([]);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load doctors';
      setError(msg);
      toast.error(msg);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Re-fetch when specialization changes
  useEffect(() => {
    fetchDoctors(searchQuery, specialization);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialization]);

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(searchQuery, specialization);
  };

  // Clear all filters
  const handleClear = () => {
    setSearchQuery('');
    setSpecialization('');
    fetchDoctors('', '');
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Loading...' : `${total} doctor${total !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Search Bar + Specialization Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 style={{ color: 'var(--text-primary)' }} px-4 py-2.5 rounded-lg
                       text-sm font-medium transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </form>

        {/* Specialization filter */}
        <div className="relative sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none
                       bg-white cursor-pointer"
          >
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters */}
      {(searchQuery || specialization) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Active filters:</span>
          {searchQuery && (
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              Search: "{searchQuery}"
            </span>
          )}
          {specialization && (
            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {specialization}
            </span>
          )}
          <button
            onClick={handleClear}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading doctors...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-medium">Failed to load doctors</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchDoctors(searchQuery, specialization)}
            className="flex items-center gap-2 bg-blue-600 style={{ color: 'var(--text-primary)' }} px-4 py-2 rounded-lg
                       text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && doctors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-medium">No doctors found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery || specialization
                ? 'Try adjusting your search or filters'
                : 'No doctors have been added yet. Contact admin.'}
            </p>
          </div>
          {(searchQuery || specialization) && (
            <button
              onClick={handleClear}
              className="text-blue-600 hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Doctors Grid */}
      {!loading && !error && doctors.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            Showing {doctors.length} of {total} doctor{total !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}