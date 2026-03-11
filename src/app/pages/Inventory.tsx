import { useState } from "react";
import { Edit, Trash2, Filter, Plus, ChevronLeft, ChevronRight, MapPin, Eye, Search } from "lucide-react";
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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useInventory, InventoryAsset } from "../context/InventoryContext";

const CATEGORY_STYLES: Record<string, string> = {
  "System Unit": "bg-blue-100 text-blue-700",
  Monitor: "bg-teal-100 text-teal-700",
  Keyboard: "bg-purple-100 text-purple-700",
  Mouse: "bg-green-100 text-green-700",
  Headset: "bg-orange-100 text-orange-700",
  Webcam: "bg-indigo-100 text-indigo-700",
  Extra: "bg-gray-100 text-gray-600",
};

const ITEMS_PER_PAGE = 8;

const ASSET_TYPE_PREFIXES: Record<string, string> = {
  "System Unit": "SYS",
  Monitor: "MON",
  Keyboard: "KBD",
  Mouse: "MSE",
  Headset: "HDS",
  Webcam: "WCM",
  Extra: "EXT",
};

const BRAND_CODES: Record<string, string> = {
  Dell: "DL",
  HP: "HP",
  Logitech: "LG",
  Samsung: "SM",
  LG: "LG",
  Razer: "RZ",
  Jabra: "JB",
  Microsoft: "MS",
  Keychron: "KC",
  Apple: "AP",
  Acer: "AC",
  Asus: "AS",
};

function generateSKU(assetType: string, brand: string, id: number): string {
  const typeCode = ASSET_TYPE_PREFIXES[assetType] || "AST";
  const brandCode = BRAND_CODES[brand] || brand.slice(0, 2).toUpperCase();
  const num = String(id).padStart(3, "0");
  return `${typeCode}-${brandCode}-${num}`;
}

export default function Inventory() {
  const { inventory, addAsset, updateAsset, deleteAsset, loading } = useInventory();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [filterAssetStatus, setFilterAssetStatus] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<InventoryAsset | null>(null);
  const [viewTarget, setViewTarget] = useState<InventoryAsset | null>(null);
  const [editTarget, setEditTarget] = useState<InventoryAsset | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    assetType: "",
    brand: "",
    model: "",
    serialNumber: "",
    quantity: "",
    minQuantity: "",
    price: "",
    assetStatus: "",
    condition: "",
    purchaseDate: "",
    location: "",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0BF00] mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const filtered = inventory.filter((asset) => {
    // Search logic
    const q = search.toLowerCase();
    const matchSearch = !search ||
      asset.assetName.toLowerCase().includes(q) ||
      asset.sku.toLowerCase().includes(q) ||
      asset.brand.toLowerCase().includes(q) ||
      asset.model.toLowerCase().includes(q) ||
      asset.serialNumber.toLowerCase().includes(q) ||
      asset.category.toLowerCase().includes(q) ||
      asset.location.toLowerCase().includes(q) ||
      asset.locationCode.toLowerCase().includes(q);
    
    // Filter logic
    const catOk = filterCategory === "all" || asset.category === filterCategory;
    const stockStatusOk = filterStockStatus === "all" || asset.stockStatus === filterStockStatus;
    const assetStatusOk = filterAssetStatus === "all" || asset.assetStatus === filterAssetStatus;
    
    return matchSearch && catOk && stockStatusOk && assetStatusOk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      assetType: "",
      brand: "",
      model: "",
      serialNumber: "",
      quantity: "",
      minQuantity: "",
      price: "",
      assetStatus: "",
      condition: "",
      purchaseDate: "",
      location: "",
    });
    setAddModalOpen(true);
    setEditTarget(null);
  };

  const handleOpenEditModal = (asset: InventoryAsset) => {
    setFormData({
      assetType: asset.category,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      quantity: String(asset.quantity),
      minQuantity: String(asset.minQuantity),
      price: String(asset.price),
      assetStatus: asset.assetStatus,
      condition: asset.condition,
      purchaseDate: asset.purchaseDate,
      location: `${asset.location} (${asset.locationCode})`,
    });
    setEditTarget(asset);
    setAddModalOpen(true);
    setViewTarget(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetType || !formData.brand || !formData.model) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Parse location
    const locationMatch = formData.location.match(/^(.+?)\s*\(([^)]+)\)$/);
    const location = locationMatch ? locationMatch[1] : formData.location;
    const locationCode = locationMatch ? locationMatch[2] : "";

    // Calculate stock status based on quantity
    let stockStatus: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock";
    const qty = Number(formData.quantity) || 0;
    const minQty = Number(formData.minQuantity) || 0;
    if (qty === 0) {
      stockStatus = "Out of Stock";
    } else if (qty <= minQty) {
      stockStatus = "Low Stock";
    }

    try {
      if (editTarget) {
        // Update existing asset
        await updateAsset({
          ...editTarget,
          assetName: `${formData.brand} ${formData.model}`,
          category: formData.assetType,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber,
          quantity: qty,
          minQuantity: minQty,
          price: Number(formData.price) || 0,
          stockStatus: stockStatus,
          assetStatus: formData.assetStatus as "Available" | "Assigned" | "Under Maintenance",
          condition: formData.condition,
          purchaseDate: formData.purchaseDate,
          location,
          locationCode,
        });
      } else {
        // Add new asset - generate SKU
        const nextId = Math.max(...inventory.map((a) => {
          const match = a.sku.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        }), 0) + 1;
        
        const sku = generateSKU(formData.assetType, formData.brand, nextId);

        await addAsset({
          assetName: `${formData.brand} ${formData.model}`,
          sku: sku,
          category: formData.assetType,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber,
          quantity: qty,
          minQuantity: minQty,
          price: Number(formData.price) || 0,
          stockStatus: stockStatus,
          assetStatus: formData.assetStatus as "Available" | "Assigned" | "Under Maintenance",
          condition: formData.condition,
          purchaseDate: formData.purchaseDate,
          location,
          locationCode,
        });
      }

      setAddModalOpen(false);
      setEditTarget(null);
    } catch (error) {
      console.error("Form submission failed:", error);
    }
  };

  const getStockStatusStyle = (status: string) => {
    switch (status) {
      case "In Stock":
        return "text-green-600";
      case "Low Stock":
        return "text-orange-500";
      case "Out of Stock":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStockStatusDot = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500";
      case "Low Stock":
        return "bg-orange-400";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getAssetStatusStyle = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700 border-green-200";
      case "Assigned":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Under Maintenance":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const categories = ["System Unit", "Monitor", "Keyboard", "Mouse", "Headset", "Webcam", "Extra"];

  const fieldClass =
    "h-9 text-sm bg-white border-gray-200 rounded-lg focus:border-[#B0BF00] focus:ring-[#B0BF00]";

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Stock List Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 overflow-hidden hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
        {/* Stock List Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-100/50">
          <h3 className="text-sm font-semibold text-gray-800">Inventory Assets</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs text-gray-600 placeholder-gray-400 outline-none w-full"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {(filterCategory !== "all" || filterStockStatus !== "all" || filterAssetStatus !== "all") && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#B0BF00]" />
              )}
            </button>

            {/* Add Asset Button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B0BF00] hover:bg-[#9aaa00] text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Asset</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="px-4 md:px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3 md:gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Types</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Stock:</span>
              <select
                value={filterStockStatus}
                onChange={(e) => { setFilterStockStatus(e.target.value); setCurrentPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Stock</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Asset Status:</span>
              <select
                value={filterAssetStatus}
                onChange={(e) => { setFilterAssetStatus(e.target.value); setCurrentPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-[#B0BF00]"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
            {(filterCategory !== "all" || filterStockStatus !== "all" || filterAssetStatus !== "all") && (
              <button
                onClick={() => { setFilterCategory("all"); setFilterStockStatus("all"); setFilterAssetStatus("all"); setCurrentPage(1); }}
                className="text-xs text-[#B0BF00] hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Asset Name
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Asset Status
                </th>
                <th className="text-right px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400 italic">
                    No assets found.
                  </td>
                </tr>
              ) : (
                paginated.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Asset Name */}
                    <td className="px-6 py-3.5">
                      <div>
                        <span className="text-sm font-medium text-gray-800 block">
                          {asset.assetName}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          <span className="text-[11px] text-indigo-600">
                            {asset.location} ({asset.locationCode})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400 font-mono">{asset.sku}</span>
                    </td>

                    {/* Category Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          CATEGORY_STYLES[asset.category] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {asset.category}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-800 block">
                        {asset.quantity}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Min: {asset.minQuantity}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700">
                        ₱{asset.price.toLocaleString()}
                      </span>
                    </td>

                    {/* Stock Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStockStatusStyle(asset.stockStatus)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getStockStatusDot(asset.stockStatus)}`} />
                        {asset.stockStatus}
                      </span>
                    </td>

                    {/* Asset Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${getAssetStatusStyle(asset.assetStatus)}`}
                      >
                        {asset.assetStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewTarget(asset)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(asset)}
                          className="p-1.5 text-gray-400 hover:text-[#B0BF00] hover:bg-[#B0BF00]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(asset)}
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium">
            Showing {paginated.length} of {filtered.length} assets
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
            <span className="text-xs text-gray-500 px-1">
              {currentPage} / {totalPages}
            </span>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-800">
                "{deleteTarget?.assetName}"
              </span>{" "}
              from inventory? This action cannot be undone.
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

      {/* View Asset Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewTarget?.assetName}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 py-2">
              {/* Asset Name & SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Asset Name</p>
                  <p className="text-sm text-gray-800">{viewTarget.assetName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">SKU</p>
                  <p className="text-sm text-gray-800 font-mono">{viewTarget.sku}</p>
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Brand</p>
                  <p className="text-sm text-gray-800">{viewTarget.brand}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Model</p>
                  <p className="text-sm text-gray-800">{viewTarget.model}</p>
                </div>
              </div>

              {/* Category & Serial Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Category</p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                      CATEGORY_STYLES[viewTarget.category] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {viewTarget.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Serial Number</p>
                  <p className="text-sm text-gray-800 font-mono">{viewTarget.serialNumber}</p>
                </div>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Quantity</p>
                  <p className="text-sm text-gray-800">
                    {viewTarget.quantity}{" "}
                    <span className="text-xs text-gray-400">(Min: {viewTarget.minQuantity})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Unit Price</p>
                  <p className="text-sm text-gray-800">₱{viewTarget.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Stock Status & Asset Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Stock Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStockStatusStyle(viewTarget.stockStatus)}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${getStockStatusDot(viewTarget.stockStatus)}`} />
                    {viewTarget.stockStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Asset Status</p>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border ${getAssetStatusStyle(viewTarget.assetStatus)}`}
                  >
                    {viewTarget.assetStatus}
                  </span>
                </div>
              </div>

              {/* Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Condition</p>
                  <p className="text-sm text-gray-800">{viewTarget.condition}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Purchase Date</p>
                  <p className="text-sm text-gray-800">
                    {viewTarget.purchaseDate ? new Date(viewTarget.purchaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }) : "—"}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  <p className="text-sm text-indigo-600">
                    {viewTarget.location} ({viewTarget.locationCode})
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white"
              onClick={() => {
                if (viewTarget) {
                  handleOpenEditModal(viewTarget);
                }
              }}
            >
              Edit Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={addModalOpen} onOpenChange={(open) => { setAddModalOpen(open); if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update the asset details below"
                : "Fill in the details to add a new asset to the inventory"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {/* Asset Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Asset Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Asset Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Asset Type *</Label>
                  <Select
                    value={formData.assetType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, assetType: value }))}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Brand *</Label>
                  <Input
                    placeholder="e.g., Dell, HP, Logitech"
                    value={formData.brand}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    required
                    className={fieldClass}
                  />
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Model *</Label>
                  <Input
                    placeholder="e.g., OptiPlex 7090"
                    value={formData.model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                    required
                    className={fieldClass}
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Serial Number</Label>
                  <Input
                    placeholder="e.g., DL-SU-78321"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Stock & Pricing */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Stock & Pricing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Quantity *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                    min="0"
                    className={fieldClass}
                  />
                </div>

                {/* Min Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Min Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minQuantity: e.target.value }))}
                    min="0"
                    className={fieldClass}
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Unit Price (₱)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    min="0"
                    step="0.01"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Status & Condition */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status & Condition
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Asset Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Asset Status *</Label>
                  <Select
                    value={formData.assetStatus}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, assetStatus: value }))}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Purchase Date</Label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Location
              </h4>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Department (JMS)">IT Department (JMS)</SelectItem>
                    <SelectItem value="HR Department (MMS)">HR Department (MMS)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400">Select the department location for this asset</p>
              </div>
            </div>

            {/* Form Actions */}
            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setAddModalOpen(false); setEditTarget(null); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#B0BF00] hover:bg-[#9aaa00] text-white"
              >
                {editTarget ? "Update Asset" : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}