import React, { useState } from "react";
import {
  useGetEmailUsersQuery,
  useCreateEmailUserMutation,
  useUpdateEmailUserMutation,
  useDeleteEmailUserMutation,
  useGetEmailMessagesQuery,
  useCreateEmailMessageMutation,
  useUpdateEmailMessageMutation,
  useDeleteEmailMessageMutation,
} from "@/rtk/slices/adminApiSlice";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import AdminHeader from "../AdminHeader";
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, Mail, MessageSquare, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const EmailTypeDetailsPage: React.FC = () => {
  const { typeId } = useParams<{ typeId: string }>();

  /* ---------------- USERS ---------------- */
  const { data: usersData } = useGetEmailUsersQuery(Number(typeId));
  const [createUser] = useCreateEmailUserMutation();
  const [updateUser] = useUpdateEmailUserMutation();
  const [deleteUser] = useDeleteEmailUserMutation();
  const {t}=useTranslation()
  const navigate = useNavigate();

  /* ---------------- MESSAGES ---------------- */
  const { data: messagesData } = useGetEmailMessagesQuery(Number(typeId));
  const [createMessage] = useCreateEmailMessageMutation();
  const [updateMessage] = useUpdateEmailMessageMutation();
  const [deleteMessage] = useDeleteEmailMessageMutation();

  /* ---------------- TABS ---------------- */
  const [activeTab, setActiveTab] = useState<"users" | "messages">("users");

  /* ---------------- MODALS ---------------- */
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);

  /* ---------------- FORM STATE ---------------- */
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newMessage, setNewMessage] = useState({ subject: "", body: "" });

  /* ---------------- HANDLERS ---------------- */
  const openAddUserModal = () => {
    setEditingUser(null);
    setNewUserEmail("");
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setNewUserEmail(user.email);
    setUserModalOpen(true);
  };

  const openAddMessageModal = () => {
    setEditingMessage(null);
    setNewMessage({ subject: "", body: "" });
    setMessageModalOpen(true);
  };

  const openEditMessageModal = (message: any) => {
    setEditingMessage(message);
    setNewMessage({ subject: message.subject, body: message.body });
    setMessageModalOpen(true);
  };

  const handleUserSubmit = async () => {
    try {
      if (!newUserEmail) return toast.error("Email is required");
      if (editingUser) {
        await updateUser({ userId: editingUser.id, data: { email: newUserEmail } });
        toast.success("User updated successfully");
      } else {
        await createUser({ typeId: Number(typeId), email: newUserEmail });
        toast.success("User added successfully");
      }
      setUserModalOpen(false);
    } catch (err) {
      toast.error("Error saving user");
    }
  };

  const handleMessageSubmit = async () => {
    try {
      if (!newMessage.body)
        return toast.error("Subject & Body are required");
      if (editingMessage) {
        await updateMessage({
          messageId: editingMessage.id,
          data: { subject: newMessage.subject, body: newMessage.body },
        });
        toast.success("Message updated successfully");
      } else {
        await createMessage({ typeId: Number(typeId), ...newMessage } as any);
        toast.success("Message added successfully");
      }
      setMessageModalOpen(false);
    } catch (err) {
      toast.error("Error saving message");
    }
  };

  const handleDeleteUser = (id: number) => {
    if (confirm("Are you sure to delete this user?")) {
      deleteUser(id);
      toast.success("User deleted successfully");
    }
  };

  const handleDeleteMessage = (id: number) => {
    if (confirm("Are you sure to delete this message?")) {
      deleteMessage(id);
      toast.success("Message deleted successfully");
    }
  };

  const handleActivateUser = (id: number) => {
    updateUser({ userId: id, data: { is_active: true } });
    toast.success("User activated");
  };

  const handleActivateMessage = (id: number) => {
    updateMessage({ messageId: id, data: { is_active: true } });
    toast.success("Message activated");
  };

  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useAdminSidebar();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar activePath="/admin/settings/email" />

      <div
        className={cn(
          "transition-all duration-300 p-4 lg:px-8 animate-in fade-in-50 duration-500",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          "ml-0"
        )}
      >
        <AdminHeader />
        <Toaster position="top-right" toastOptions={{
          className: 'font-medium',
          duration: 3000,
        }} />

        <div className="max-w-7xl mx-auto space-y-6 mt-2">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <div className="p-1.5 rounded-lg bg-white group-hover:bg-gray-100 shadow-sm transition-all">
              <ArrowLeft size={18} />
            </div>
            <span>Back</span>
          </button>

          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">
                {t('admin.email.subtitle')}
         
              </h1>
            <p className="text-blue-100">
         
                   {t('admin.email.detail')}
              </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
            <button
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                activeTab === "users"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              )}
              onClick={() => setActiveTab("users")}
            >
              <Mail size={18} />
              Email
            </button>
            <button
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                activeTab === "messages"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              )}
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare size={18} />
              Subject
            </button>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            {/* TAB CONTENT */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Email</h2>
                    <p className="text-gray-500 mt-1">Manage email recipients</p>
                  </div>
                  <button
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all duration-200 hover:shadow-xl hover:scale-105"
                    onClick={openAddUserModal}
                  >
                    <Plus size={20} />
                    Add User
                  </button>
                </div>

                <div className="space-y-3">
                  {usersData?.data.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No users yet</p>
                      <p className="text-gray-400 text-sm">Add your first user to get started</p>
                    </div>
                  ) : (
                    usersData?.data.map((u) => (
                      <div
                        key={u.id}
                        className="group border border-gray-200 hover:border-blue-300 hover:shadow-md bg-gradient-to-r from-white to-gray-50/50 p-5 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Mail className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{u.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={cn(
                                    "px-3 py-1 rounded-full text-xs font-semibold",
                                    u.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  {u.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              onClick={() => openEditUserModal(u)}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              onClick={() => handleDeleteUser(u.id)}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                            {!u.is_active && (
                              <button
                                className="p-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                onClick={() => handleActivateUser(u.id)}
                                title="Activate"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
                    <p className="text-gray-500 mt-1">Manage email templates</p>
                  </div>
                  <button
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all duration-200 hover:shadow-xl hover:scale-105"
                    onClick={openAddMessageModal}
                  >
                    <Plus size={20} />
                    Add Message
                  </button>
                </div>

                <div className="space-y-3">
                  {messagesData?.data.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No messages yet</p>
                      <p className="text-gray-400 text-sm">Create your first message template</p>
                    </div>
                  ) : (
                    messagesData?.data.map((m) => (
                      <div
                        key={m.id}
                        className="group border border-gray-200 hover:border-indigo-300 hover:shadow-md bg-gradient-to-r from-white to-gray-50/50 p-5 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <div className="p-3 bg-indigo-100 rounded-lg h-fit">
                              <MessageSquare className="text-indigo-600" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-bold text-gray-900 text-lg">{m.subject}</p>
                                <span
                                  className={cn(
                                    "px-3 py-1 rounded-full text-xs font-semibold",
                                    m.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  {m.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <p className="text-gray-600 line-clamp-2">{m.body}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              onClick={() => openEditMessageModal(m)}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              onClick={() => handleDeleteMessage(m.id)}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                            {!m.is_active && (
                              <button
                                className="p-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                onClick={() => handleActivateMessage(m.id)}
                                title="Activate"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODALS */}
        <Modal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          title={editingUser ? "Edit User" : "Add New User"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                onClick={handleUserSubmit}
              >
                {editingUser ? "Update User" : "Add User"}
              </button>
              <button
                className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors"
                onClick={() => setUserModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          title={editingMessage ? "Edit Message" : "Add New Message"}
        >
          <div className="space-y-4">
            {/* <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Email subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage((p) => ({ ...p, subject: e.target.value }))}
              />
            </div> */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                 Subject
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Email body content"
                rows={5}
                value={newMessage.body}
                onChange={(e) => setNewMessage((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                onClick={handleMessageSubmit}
              >
                {editingMessage ? "Update Message" : "Add Message"}
              </button>
              <button
                className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors"
                onClick={() => setMessageModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default EmailTypeDetailsPage;