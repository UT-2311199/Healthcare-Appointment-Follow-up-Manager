import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Stethoscope } from 'lucide-react';
import api from '../../api/axios';
import DoctorForm from '../../components/admin/DoctorForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SPECIALIZATIONS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function ManageDoctors() {
  const [doctors,        setDoctors]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [editingDoctor,  setEditingDoctor]  = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [search,         setSearch]         = useState('');
  const [specFilter,     setSpecFilter]     = useState('');

  useEffect(() => { fetchDoctors(); }, [search, specFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.append('search', search);
      if (specFilter) params.append('specialization', specFilter);
      const { data } = await api.get(`/admin/doctors?${params}`);
      setDoctors(data.doctors || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (data.qualificationsStr) {
        data.qualifications = data.qualificationsStr.split(',').map((q) => q.trim());
      }
      if (editingDoctor) {
        await api.put(`/admin/doctors/${editingDoctor._id}`, data);
        toast.success('Doctor updated');
      } else {
        await api.post('/admin/doctors', data);
        toast.success('Doctor created');
      }
      setShowModal(false);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this doctor? All associated appointments will be affected.')) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      toast.success('Doctor deleted');
      fetchDoctors();
    } catch {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
          <p className="text-sm text-gray-500">{doctors.length} doctors registered</p>
        </div>
        <button
          onClick={() => { setEditingDoctor(null); setShowModal(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-56"
          value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value)}
        >
          <option value="">All Specializations</option>
          {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading doctors..." />
      ) : doctors.length === 0 ? (
        <div className="card text-center py-16">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Doctor</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium hidden md:table-cell">Specialization</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium hidden lg:table-cell">Hours</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium hidden lg:table-cell">Slot</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center
                                      justify-center text-primary-700 font-bold text-sm">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Dr. {doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600 hidden md:table-cell">
                    {doc.specialization}
                  </td>
                  <td className="py-3 px-3 text-gray-500 hidden lg:table-cell">
                    {doc.workingHours?.start} - {doc.workingHours?.end}
                  </td>
                  <td className="py-3 px-3 text-gray-500 hidden lg:table-cell">
                    {doc.slotDuration}min
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingDoctor(doc); setShowModal(true); }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingDoctor(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <DoctorForm
                defaultValues={editingDoctor}
                onSubmit={handleSave}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}