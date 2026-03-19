import { useState, useEffect } from "react";
import { useAuth, UserRole } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserX,
  ShieldCheck,
  Shield,
  UserCog,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Download,
} from "lucide-react";

interface SystemUser {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  auth_id: string;
  is_blocked?: boolean;
  blocked_at?: string | null;
}

export default function UserManagement() {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [viewTarget, setViewTarget] = useState<SystemUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [blockTarget, setBlockTarget] = useState<SystemUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "" as UserRole | "",
  });

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.email || !formData.password || !formData.fullName || !formData.role) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Check if email already exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", formData.email)
      .single();

    if (existingUser) {
      toast.error(`A user with email "${formData.email}" already exists. Please use a different email.`);
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
          toast.error(`Email "${formData.email}" is already registered. Please use a different email or delete the existing user first.`);
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase.from("users").insert([
          {
            auth_id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
          },
        ]);

        if (profileError) {
          // If profile creation fails, try to clean up the auth user
          console.error("Profile creation failed, attempting cleanup:", profileError);
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }

        toast.success(`${formData.role} "${formData.fullName}" added successfully`);
        setAddModalOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error adding user:", error);
      
      // Provide user-friendly error messages
      if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
        toast.error(`Email "${formData.email}" is already registered. Please use a different email.`);
      } else if (error.message?.includes("Invalid email")) {
        toast.error("Please enter a valid email address");
      } else if (error.code === "23505") {
        // Unique constraint violation
        toast.error("This email is already in use. Please use a different email.");
      } else if (error.code === "42501" || error.message?.includes("row-level security")) {
        // RLS policy error - provide clear instructions
        toast.error("Database permission error. Please run the SQL fix script in Supabase. Check /RUN-THIS-NOW.sql or /URGENT-FIX-STEPS.md for instructions.", {
          duration: 10000,
        });
        console.error("🚨 RLS POLICY ERROR - Action Required:");
        console.error("1. Open Supabase SQL Editor");
        console.error("2. Run the script from /RUN-THIS-NOW.sql");
        console.error("3. See /URGENT-FIX-STEPS.md for detailed instructions");
      } else {
        toast.error(error.message || "Failed to add user. Please try again.");
      }
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editTarget) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          role: formData.role,
        })
        .eq("user_id", editTarget.user_id);

      if (error) throw error;

      toast.success("User updated successfully");
      
      // If the updated user is the current logged-in user, refresh their session
      if (user && editTarget.user_id === user.id) {
        await refreshUser();
        toast.success("Your role has been updated. Interface will update automatically.", {
          duration: 5000,
        });
      }
      
      setEditTarget(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      // Delete from users table
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("user_id", deleteTarget.user_id);

      if (userError) throw userError;

      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        deleteTarget.auth_id
      );

      if (authError) {
        console.error("Error deleting auth user:", authError);
        // Continue even if auth deletion fails
      }

      toast.success("User deleted successfully");
      setDeleteTarget(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleToggleBlockUser = async () => {
    if (!blockTarget) return;

    if (user && blockTarget.user_id === user.id) {
      toast.error("You cannot block your own account.");
      return;
    }

    try {
      const shouldBlock = !blockTarget.is_blocked;
      const { error } = await supabase
        .from("users")
        .update({
          is_blocked: shouldBlock,
          blocked_at: shouldBlock ? new Date().toISOString() : null,
        })
        .eq("user_id", blockTarget.user_id);

      if (error) throw error;

      toast.success(
        shouldBlock
          ? `${blockTarget.full_name} has been blocked successfully.`
          : `${blockTarget.full_name} has been unblocked successfully.`
      );

      setBlockTarget(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating block status:", error);
      toast.error(error.message || "Failed to update user block status");
    }
  };

  const handleOpenEditModal = (user: SystemUser) => {
    setEditTarget(user);
    setFormData({
      email: user.email,
      password: "",
      fullName: user.full_name,
      role: user.role,
    });
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      role: "",
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return Shield;
      case "IT Officers":
        return UserCog;
      case "HR Officers":
        return Briefcase;
    }
  };

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "IT Officers":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "HR Officers":
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  // Filter and paginate
  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fieldClass = "h-10 text-sm rounded-lg border-gray-200 focus:border-[#B0BF00] focus:ring-[#B0BF00]";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B0BF00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "Admin").length,
    itOfficers: users.filter(u => u.role === "IT Officers").length,
    hrOfficers: users.filter(u => u.role === "HR Officers").length,
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#B0BF00] to-[#8a9600] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-sm text-white/80 mt-0.5">Manage system users and their roles</p>
            </div>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-white hover:bg-white/90 text-[#B0BF00] h-11 px-5 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "bg-gradient-to-br from-gray-500 to-gray-600", iconBg: "bg-gray-100" },
          { label: "Admins", value: stats.admins, icon: Shield, color: "bg-gradient-to-br from-purple-500 to-purple-600", iconBg: "bg-purple-100" },
          { label: "IT Officers", value: stats.itOfficers, icon: UserCog, color: "bg-gradient-to-br from-blue-500 to-blue-600", iconBg: "bg-blue-100" },
          { label: "HR Officers", value: stats.hrOfficers, icon: Briefcase, color: "bg-gradient-to-br from-green-500 to-green-600", iconBg: "bg-green-100" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-gradient-to-br from-', 'text-').replace(/-\d+$/, '-500').split(' ')[0]}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-12 h-11 text-sm border-2 border-gray-200 rounded-xl focus:border-[#B0BF00] focus:ring-4 focus:ring-[#B0BF00]/10 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-2 hover:bg-gray-50 transition-all"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-2 hover:bg-gray-50 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No users found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((systemUser) => {
                  const RoleIcon = getRoleIcon(systemUser.role);
                  return (
                    <tr key={systemUser.user_id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#B0BF00] to-[#8a9600] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {systemUser.full_name.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#B0BF00] transition-colors">
                            {systemUser.full_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{systemUser.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border-2 ${getRoleStyle(
                            systemUser.role
                          )}`}
                        >
                          <RoleIcon className="w-4 h-4" />
                          {systemUser.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                            systemUser.is_blocked
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {systemUser.is_blocked ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          {systemUser.is_blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">
                          {new Date(systemUser.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewTarget(systemUser)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(systemUser)}
                            className="p-2 text-gray-400 hover:text-[#B0BF00] hover:bg-[#B0BF00]/10 rounded-xl transition-all duration-200 hover:scale-110"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBlockTarget(systemUser)}
                            disabled={user?.id === systemUser.user_id}
                            className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 ${
                              systemUser.is_blocked
                                ? "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                                : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title={systemUser.is_blocked ? "Unblock" : "Block"}
                          >
                            {systemUser.is_blocked ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(systemUser)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-200 bg-gray-50/50">
          <p className="text-xs text-gray-600 font-semibold">
            Showing <span className="text-[#B0BF00]">{paginated.length}</span> of <span className="text-[#B0BF00]">{filtered.length}</span> users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-white hover:border-[#B0BF00] hover:text-[#B0BF00] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="px-4 py-2 bg-[#B0BF00] text-white rounded-xl text-xs font-bold">
              {currentPage} / {totalPages || 1}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-white hover:border-[#B0BF00] hover:text-[#B0BF00] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Dialog
        open={addModalOpen || !!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
            setEditTarget(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update user information and role"
                : "Create a new IT Officer or HR Officer account"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editTarget ? handleUpdateUser : handleAddUser} className="space-y-4 py-2">
            <div className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Full Name *</Label>
                <Input
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  required
                  className={fieldClass}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Email *</Label>
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={!!editTarget}
                  className={fieldClass}
                />
              </div>

              {/* Password (only for new users) */}
              {!editTarget && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Password *</Label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    minLength={6}
                    className={fieldClass}
                  />
                  <p className="text-xs text-gray-400">
                    Minimum 6 characters
                  </p>
                </div>
              )}

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value as UserRole }))
                  }
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="IT Officers">IT Officers</SelectItem>
                    <SelectItem value="HR Officers">HR Officers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddModalOpen(false);
                  setEditTarget(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white"
              >
                {editTarget ? "Update User" : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewTarget?.full_name}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Full Name</p>
                <p className="text-sm text-gray-800">{viewTarget.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                <p className="text-sm text-gray-800">{viewTarget.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Role</p>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${getRoleStyle(
                    viewTarget.role
                  )}`}
                >
                  {(() => {
                    const Icon = getRoleIcon(viewTarget.role);
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {viewTarget.role}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    viewTarget.is_blocked
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {viewTarget.is_blocked ? (
                    <UserX className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {viewTarget.is_blocked ? "Blocked" : "Active"}
                </span>
              </div>
              {viewTarget.is_blocked && viewTarget.blocked_at && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Blocked At</p>
                  <p className="text-sm text-gray-800">
                    {new Date(viewTarget.blocked_at).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Created</p>
                <p className="text-sm text-gray-800">
                  {new Date(viewTarget.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation */}
      <Dialog open={!!blockTarget} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {blockTarget?.is_blocked ? "Unblock User" : "Block User"}
            </DialogTitle>
            <DialogDescription>
              {blockTarget?.is_blocked ? (
                <>
                  Restore access for{" "}
                  <span className="font-semibold text-gray-800">
                    "{blockTarget?.full_name}"
                  </span>
                  ?
                </>
              ) : (
                <>
                  Block{" "}
                  <span className="font-semibold text-gray-800">
                    "{blockTarget?.full_name}"
                  </span>
                  ? They will no longer be able to sign in until unblocked.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBlockTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className={
                blockTarget?.is_blocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }
              onClick={handleToggleBlockUser}
            >
              {blockTarget?.is_blocked ? "Unblock" : "Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                "{deleteTarget?.full_name}"
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
