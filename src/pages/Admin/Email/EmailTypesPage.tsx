import React, { useState } from "react";
import {
  useGetEmailTypesQuery,
  useCreateEmailTypeMutation,
  useUpdateEmailTypeMutation,
  useDeleteEmailTypeMutation,
} from "@/rtk/slices/adminApiSlice";
import TypeDetailsModal from "./TypeDetailsModal";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import AdminHeader from "../AdminHeader";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";

const EmailTypesPage = () => {
  const { data, isLoading } = useGetEmailTypesQuery();
  const [createType] = useCreateEmailTypeMutation();
  const [updateType] = useUpdateEmailTypeMutation();
  const [deleteType] = useDeleteEmailTypeMutation();

  const { t } = useTranslation();

  const navigate = useNavigate();

  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [newTypeName, setNewTypeName] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Mail className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-gray-600 font-medium">{t('admin.dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newTypeName.trim()) return alert("Type name required");
    await createType({ type_name: newTypeName });
    setNewTypeName("");
  };

  const handleUpdate = async (id: number) => {
    const name = prompt("Enter new type name")?.trim();
    if (name) await updateType({ id, data: { type_name: name } });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) await deleteType(id);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar activePath="/admin/settings/email" />
      <div
        className={cn(
          "transition-all duration-300 p-4 lg:px-8 space-y-6 animate-in fade-in-50 duration-500",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          "ml-0"
        )}
      >
        <AdminHeader />

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Mail size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('admin.email.title')}</h1>
                <p className="text-blue-100 mt-1">Manage your email types and configurations</p>
              </div>
            </div>
          </div>

          {/* Create New Type Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Email Type</h2>
                <p className="text-gray-500 text-sm">Add a new email type to your system</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter email type name..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all duration-200 hover:shadow-xl hover:scale-105"
                onClick={handleCreate}
              >
                <Plus size={20} />
                Create Type
              </button>
            </div>
          </div>

          {/* Email Types List */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Email Types</h2>
                <p className="text-gray-500 mt-1">
                  {data?.data.length || 0} email type{data?.data.length !== 1 ? 's' : ''} configured
                </p>
              </div>
            </div>

            {data?.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
                  <Mail size={48} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No email types yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first email type to get started</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data?.data.map((type, index) => (
                  <div
                    key={type.id}
                    className="group border border-gray-200 hover:border-blue-300 hover:shadow-lg bg-gradient-to-r from-white to-gray-50/50 p-5 rounded-xl transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                          <Mail className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg mb-1">{type.type_name}</p>
                          <div className="flex items-center gap-2">
                            {type.is_active ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <CheckCircle size={14} />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                <XCircle size={14} />
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md shadow-blue-200 transition-all duration-200 hover:shadow-lg hover:scale-105"
                          onClick={() => navigate(`/admin/email-types/${type.id}`)}
                        >
                          <Eye size={16} />
                          View / Edit
                        </button>
                        <button
                          className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-4 py-2.5 rounded-lg font-semibold border border-yellow-200 transition-all duration-200 hover:border-yellow-300"
                          onClick={() => handleUpdate(type.id)}
                        >
                          <Edit2 size={16} />
                          Rename
                        </button>
                        <button
                          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-semibold border border-red-200 transition-all duration-200 hover:border-red-300"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* {selectedType && (
          <TypeDetailsModal typeId={selectedType} onClose={() => setSelectedType(null)} />
        )} */}
      </div>
    </div>
  );
};

export default EmailTypesPage;