import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Save, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAssignments } from "../context/AssignmentsContext";
import { useInventory } from "../context/InventoryContext";

// Workstation configuration and mappings
const WORKSTATION_OPTIONS: Record<string, string[]> = {
  "IT Department": ["PROD 1", "PROD 2", "IT Room", "Conference Room", "Front Desk"],
  "HR Department": ["Front Desk", "Conference Room", "HR Room", "Production Area"],
};

const FLOOR_MAPPING: Record<string, string> = {
  "IT Department": "2nd Floor",
  "HR Department": "3rd Floor",
};

// Seat numbers per workstation (IT Department only)
const SEAT_NUMBERS: Record<string, number[]> = {
  "PROD 1": [53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86],
  "PROD 2": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,88,89,90,91,92,93],
  "Conference Room": [94,95,96,97,98,99],
  "IT Room": [100,101,102],
  "Front Desk": [103],
};

export default function AddAssignment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { addAssignment, updateAssignment, getAssignment, nextId, assignments } = useAssignments();
  const { inventory } = useInventory();

  const existing = id ? getAssignment(id) : undefined;

  const [selectedAsset, setSelectedAsset] = useState<typeof inventory[0] | null>(() => {
    if (existing) {
      return inventory.find((a) => a.sku === existing.assetSKU) || null;
    }
    return null;
  });

  const [formData, setFormData] = useState({
    assetId: existing ? String(inventory.find((a) => a.sku === existing.assetSKU)?.id ?? "") : "",
    assignedTo: existing?.assignedTo === "Unassigned" ? "" : (existing?.assignedTo ?? ""),
    workstation: existing?.workstation ?? "",
    seatNumber: existing?.seatNumber ? String(existing.seatNumber) : "",
    floor: existing?.floor ?? "",
    status: existing?.status ?? "Assigned",
    dateAssigned: existing?.dateAssigned ?? new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (selectedAsset) {
      const department = selectedAsset.location;
      const defaultFloor = FLOOR_MAPPING[department] || "";
      setFormData((prev) => ({
        ...prev,
        floor: defaultFloor,
        workstation: prev.workstation || "",
        seatNumber: "",
      }));
    }
  }, [selectedAsset]);

  // Reset seat number when workstation changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, seatNumber: "" }));
  }, [formData.workstation]);

  const handleAssetSelect = (assetId: string) => {
    const asset = inventory.find((a) => String(a.id) === assetId);
    setSelectedAsset(asset || null);
    setFormData((prev) => ({ ...prev, assetId, workstation: "", seatNumber: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAsset) {
      toast.error("Please select an asset.");
      return;
    }

    if (!formData.assignedTo.trim() || !formData.workstation) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Parse seat number - can be numeric or text
    const seatNum = formData.seatNumber.trim() ? parseInt(formData.seatNumber.trim(), 10) : null;

    // Only check for valid number if input was provided
    if (formData.seatNumber.trim() && isNaN(seatNum as number)) {
      toast.error("Please enter a valid seat/PC number.");
      return;
    }

    // Check seat conflict only if a valid seat number was entered
    if (seatNum && !isEditMode) {
      const conflict = assignments.find(
        (a) => a.seatNumber === seatNum && a.assignmentId !== id
      );
      if (conflict) {
        toast.error(`Seat ${seatNum} is already assigned to ${conflict.assignmentId}.`);
        return;
      }
    }

    const record = {
      assignmentId: isEditMode ? id! : nextId(),
      assetName: selectedAsset.assetName,
      assetSKU: selectedAsset.sku,
      assetCategory: selectedAsset.category,
      assignedTo: formData.assignedTo.trim(),
      department: selectedAsset.location,
      workstation: formData.workstation,
      seatNumber: seatNum,
      floor: formData.floor,
      status: formData.status as "Available" | "Assigned" | "Under Maintenance",
      dateAssigned: formData.dateAssigned,
    };

    if (isEditMode) {
      updateAssignment(record);
      toast.success("Assignment updated successfully!");
    } else {
      addAssignment(record);
      toast.success("Assignment created successfully!");
    }

    navigate("/dashboard/assignments");
  };

  const fieldClass = "h-9 text-sm bg-white border-gray-200 rounded-lg focus:border-[#B0BF00] focus:ring-[#B0BF00]";
  const selectClass = "h-9 text-sm bg-white border-gray-200 rounded-lg";

  const workstationOptions = selectedAsset ? WORKSTATION_OPTIONS[selectedAsset.location] || [] : [];
  const seatOptions = formData.workstation ? (SEAT_NUMBERS[formData.workstation] || []) : [];
  const isITDept = selectedAsset?.location === "IT Department";

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/dashboard/assignments")}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#B0BF00]/10 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-[#B0BF00]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              {isEditMode ? "Edit Asset Assignment" : "Create New Asset Assignment"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEditMode ? "Update assignment details" : "Assign an asset to a user and workstation"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Select Asset */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#B0BF00] text-white text-xs font-semibold flex items-center justify-center">1</div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Asset from Inventory</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">Asset *</Label>
              <Select value={formData.assetId} onValueChange={handleAssetSelect}>
                <SelectTrigger className={selectClass}>
                  <SelectValue placeholder="Select asset from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((asset) => (
                    <SelectItem key={asset.id} value={String(asset.id)}>
                      {asset.assetName} ({asset.sku}) — {asset.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAsset && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 font-medium">Asset details auto-filled from inventory</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "SKU", value: selectedAsset.sku, mono: true },
                    { label: "Category", value: selectedAsset.category },
                    { label: "Brand", value: selectedAsset.brand },
                    { label: "Model", value: selectedAsset.model },
                    { label: "Serial Number", value: selectedAsset.serialNumber, mono: true },
                    { label: "Condition", value: selectedAsset.condition },
                    { label: "Department (from Inventory)", value: selectedAsset.location },
                    { label: "Unit Price", value: `₱${selectedAsset.price.toLocaleString()}` },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-[10px] text-blue-600 font-medium mb-0.5">{f.label}</p>
                      <p className={`text-xs text-blue-900 ${f.mono ? "font-mono" : ""} ${f.label.includes("Department") ? "font-semibold" : ""}`}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Assignment Details */}
        {selectedAsset && (
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#B0BF00] text-white text-xs font-semibold flex items-center justify-center">2</div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignment Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned To */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs text-gray-600">Assigned To (Full Name) *</Label>
                <Input
                  placeholder="e.g., Juan dela Cruz"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                  className={fieldClass}
                />
                <p className="text-[10px] text-gray-400 italic">Enter the employee's full name - no need to create an employee record first</p>
              </div>

              {/* Department (Read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Department</Label>
                <Input value={selectedAsset.location} readOnly className={`${fieldClass} bg-gray-50 cursor-not-allowed`} />
                <p className="text-[10px] text-gray-400 italic">Auto-filled from asset location</p>
              </div>

              {/* Workstation */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Workstation *</Label>
                <Select value={formData.workstation} onValueChange={(v) => setFormData({ ...formData, workstation: v, seatNumber: "" })}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue placeholder="Select workstation" />
                  </SelectTrigger>
                  <SelectContent>
                    {workstationOptions.map((ws) => (
                      <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400 italic">
                  {selectedAsset.location === "IT Department"
                    ? "IT Department: PROD 1, PROD 2, IT Room, Conference Room, Front Desk"
                    : "HR Department workstations available"}
                </p>
              </div>

              {/* Seat Number (IT Dept only, when workstation with seat map selected) */}
              {isITDept && formData.workstation && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Seat Number / PC Number</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 1, 25, PC-101"
                    value={formData.seatNumber}
                    onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                    className={fieldClass}
                  />
                  <p className="text-[10px] text-gray-400 italic">Enter seat or PC number for floor map reference (optional)</p>
                </div>
              )}

              {/* Floor (Auto-filled) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Floor Area</Label>
                <Input value={formData.floor} readOnly className={`${fieldClass} bg-gray-50 cursor-not-allowed`} />
                <p className="text-[10px] text-gray-400 italic">
                  Auto-filled: {selectedAsset.location === "IT Department" ? "IT Dept → 2nd Floor" : "HR Dept → 3rd Floor"}
                </p>
              </div>

              {/* Date Assigned */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Date Assigned</Label>
                <Input
                  type="date"
                  value={formData.dateAssigned}
                  onChange={(e) => setFormData({ ...formData, dateAssigned: e.target.value })}
                  className={fieldClass}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className={selectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        {selectedAsset && (
          <div className="flex items-center gap-3 pb-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-[#B0BF00] hover:bg-[#9aaa00] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {isEditMode ? "Update Assignment" : "Create Assignment"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/assignments")}
              className="px-5 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Instruction when no asset selected */}
        {!selectedAsset && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Select an asset to continue</p>
            <p className="text-xs text-gray-400 mt-1">
              Choose an asset from the inventory to begin creating the assignment
            </p>
          </div>
        )}
      </form>
    </div>
  );
}