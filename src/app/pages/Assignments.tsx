import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Edit, Trash2, Eye, UserCheck, ChevronLeft, ChevronRight, Map, List } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useAssignments } from "../context/AssignmentsContext";
import FloorMapIT from "../components/FloorMapIT";
import FloorMapHR from "../components/FloorMapHR";

const STATUS_STYLES: Record<string, string> = {
  Assigned: "bg-green-100 text-green-700",
  Available: "bg-blue-100 text-blue-700",
  "Under Maintenance": "bg-amber-100 text-amber-700",
};

const ITEMS_PER_PAGE = 6;

export default function Assignments() {
  const navigate = useNavigate();
  const { assignments, deleteAssignment } = useAssignments();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<typeof assignments[0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<typeof assignments[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [selectedDepartment, setSelectedDepartment] = useState<"IT Department" | "HR Department">("IT Department");

  const filtered = assignments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.assignmentId.toLowerCase().includes(q) ||
      a.assetName.toLowerCase().includes(q) ||
      a.assetSKU.toLowerCase().includes(q) ||
      a.assignedTo.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.workstation.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAssignment(deleteTarget.assignmentId);
    toast.success(`Assignment "${deleteTarget.assignmentId}" deleted.`);
    setDeleteTarget(null);
  };

  const summaryCards = [
    { label: "Total Assignments", value: assignments.length, color: "text-gray-800" },
    { label: "Assigned", value: assignments.filter((a) => a.status === "Assigned").length, color: "text-green-600" },
    { label: "Available", value: assignments.filter((a) => a.status === "Available").length, color: "text-blue-600" },
    { label: "Under Maintenance", value: assignments.filter((a) => a.status === "Under Maintenance").length, color: "text-amber-600" },
  ];

  // IT assignments (those with seat numbers) for the floor map
  // Show ALL assignments that have seat numbers assigned, regardless of department
  const itAssignments = assignments.filter((a) => a.seatNumber != null);
  
  // HR assignments (from HR Department)
  const hrAssignments = assignments.filter((a) => a.department === "HR Department");

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {summaryCards.map((c, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 px-3 md:px-5 py-3 md:py-4 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
            <p className="text-[10px] md:text-xs text-gray-500 truncate">{c.label}</p>
            <p className={`text-xl md:text-2xl font-semibold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Switch */}
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-1 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "list" ? "bg-[#B0BF00] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Assignment List</span>
          <span className="sm:hidden">List</span>
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "map" ? "bg-[#B0BF00] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Floor Map</span>
          <span className="sm:hidden">Map</span>
        </button>
      </div>

      {/* ========== LIST TAB ========== */}
      {activeTab === "list" && (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 overflow-hidden hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Asset Assignments</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none w-full"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Status</option>
                <option value="Assigned">Assigned</option>
                <option value="Available">Available</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>

              {/* Add Button */}
              <button
                onClick={() => navigate("/dashboard/add-assignment")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B0BF00] hover:bg-[#9aaa00] text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Assignment
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["ID", "Asset", "Assigned To", "Department", "Workstation / Seat", "Floor", "Status", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider ${
                          i === 7 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400 italic">
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((assignment) => (
                    <tr key={assignment.assignmentId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-gray-400">{assignment.assignmentId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#B0BF00]/10 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-3.5 h-3.5 text-[#B0BF00]" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-800 block">{assignment.assetName}</span>
                            <span className="text-[10px] font-mono text-gray-400">{assignment.assetSKU}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm ${!assignment.assignedTo || assignment.assignedTo === "Unassigned" ? "text-gray-400 italic" : "text-gray-700"}`}>
                          {assignment.assignedTo || "Unassigned"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-600">{assignment.department}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="text-xs text-gray-600">{assignment.workstation}</span>
                          {assignment.seatNumber && (
                            <span className="ml-1.5 text-[10px] font-mono bg-[#B0BF00]/10 text-[#8a9200] px-1.5 py-0.5 rounded">
                              #{assignment.seatNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500">{assignment.floor}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_STYLES[assignment.status]}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewTarget(assignment)}
                            className="p-1.5 text-gray-400 hover:text-[#B0BF00] hover:bg-[#B0BF00]/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/edit-assignment/${assignment.assignmentId}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(assignment)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <p className="text-xs text-[#B0BF00] font-medium">
              Showing {paginated.length} of {filtered.length} assignments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
                Previous
              </button>
              <span className="text-xs text-gray-500 px-1">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== FLOOR MAP TAB ========== */}
      {activeTab === "map" && (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-6 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          {/* Department Selector and Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">
                {selectedDepartment} Floor Map — {selectedDepartment === "IT Department" ? "2nd Floor" : "3rd Floor"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedDepartment === "IT Department"
                  ? "Assignments are numbered sequentially by date (oldest = #1). Click any seat to view details."
                  : "View all HR Department asset assignments by workstation area."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Department Selector */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as "IT Department" | "HR Department")}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 outline-none focus:border-[#B0BF00]"
              >
                <option value="IT Department">IT Department</option>
                <option value="HR Department">HR Department</option>
              </select>
              
              {/* New Assignment Button */}
              <button
                onClick={() => navigate("/dashboard/add-assignment")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B0BF00] hover:bg-[#9aaa00] text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Assignment</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
          
          {/* Display the appropriate floor map */}
          {selectedDepartment === "IT Department" ? (
            <FloorMapIT assignments={itAssignments} />
          ) : (
            <FloorMapHR assignments={hrAssignments} />
          )}
        </div>
      )}

      {/* View Assignment Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              {viewTarget?.assignmentId} · {viewTarget?.assetSKU}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3 py-1">
              {[
                { label: "Asset", value: viewTarget.assetName },
                { label: "Category", value: viewTarget.assetCategory },
                { label: "Assigned To", value: viewTarget.assignedTo },
                { label: "Department", value: viewTarget.department },
                { label: "Workstation", value: viewTarget.workstation + (viewTarget.seatNumber ? ` (Seat ${viewTarget.seatNumber})` : "") },
                { label: "Floor", value: viewTarget.floor },
                { label: "Date Assigned", value: viewTarget.dateAssigned },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{f.label}</span>
                  <span className="font-medium text-gray-800">{f.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_STYLES[viewTarget.status]}`}>
                  {viewTarget.status}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>Close</Button>
            <Button
              size="sm"
              className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white"
              onClick={() => {
                navigate(`/dashboard/edit-assignment/${viewTarget?.assignmentId}`);
                setViewTarget(null);
              }}
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Edit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Delete assignment <span className="font-semibold text-gray-800">"{deleteTarget?.assignmentId}"</span> for{" "}
              <span className="font-semibold text-gray-800">{deleteTarget?.assetName}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}