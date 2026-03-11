import { useNavigate } from "react-router";
import {
  Package, AlertTriangle, XCircle, TrendingUp, TrendingDown,
  Monitor, Cpu, Keyboard, Mouse, Headphones, Camera, ArrowRight,
  CheckCircle, Clock, UserPlus, ShoppingCart, Wrench, ArchiveRestore,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAssignments } from "../context/AssignmentsContext";
import { useInventory } from "../context/InventoryContext";

const categoryColors: Record<string, string> = {
  "System Unit": "#3b82f6",
  Monitor: "#14b8a6",
  Keyboard: "#a855f7",
  Mouse: "#22c55e",
  Headset: "#f97316",
  Webcam: "#6366f1",
  Extra: "#94a3b8",
};

const categoryIcons: Record<string, React.ElementType> = {
  "System Unit": Cpu,
  Monitor: Monitor,
  Keyboard: Keyboard,
  Mouse: Mouse,
  Headset: Headphones,
  Webcam: Camera,
  Extra: Package,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { inventory, loading: inventoryLoading } = useInventory();

  if (inventoryLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0BF00] mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalItems = inventory.length;
  const totalAssets = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const inStock = inventory.filter((i) => i.stockStatus === "In Stock").length;
  const lowStock = inventory.filter((i) => i.stockStatus === "Low Stock").length;
  const outOfStock = inventory.filter((i) => i.stockStatus === "Out of Stock").length;
  const totalValue = inventory.reduce((s, i) => s + i.price * i.quantity, 0);

  // Calculate monthly trend from purchase dates (last 6 months)
  const monthlyData = (() => {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const now = new Date();
    const monthCounts: Record<string, number> = {};
    
    // Initialize all months with 0
    months.forEach(m => monthCounts[m] = 0);
    
    // Count assets by month
    inventory.forEach(item => {
      if (item.purchaseDate) {
        const purchaseDate = new Date(item.purchaseDate);
        const monthDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
        
        if (monthDiff >= 0 && monthDiff < 6) {
          const monthName = months[5 - monthDiff];
          if (monthName) {
            monthCounts[monthName] += item.quantity;
          }
        }
      }
    });
    
    return months.map(month => ({ month, items: monthCounts[month] || 0 }));
  })();

  const statCards = [
    {
      label: "Total Items",
      value: totalItems,
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      badge: null,
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: AlertTriangle,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      badge: { text: "NEEDS ATTENTION", style: "text-amber-600 bg-amber-50 border border-amber-200" },
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: XCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      badge: { text: "URGENT RESTOCK", style: "text-red-600 bg-red-50 border border-red-200" },
    },
    {
      label: "Inventory Value",
      value: `₱${totalValue.toLocaleString()}`,
      icon: TrendingUp,
      iconBg: "bg-[#B0BF00]/10",
      iconColor: "text-[#B0BF00]",
      badge: null,
    },
  ];

  // Category breakdown for donut
  const catGroups: Record<string, { inStock: number; total: number }> = {};
  inventory.forEach((item) => {
    // Use category field which is mapped from asset_type in the database
    const assetType = item.category || "Other";
    if (!catGroups[assetType]) catGroups[assetType] = { inStock: 0, total: 0 };
    catGroups[assetType].total += item.quantity;
    if (item.stockStatus === "In Stock") catGroups[assetType].inStock += item.quantity;
  });
  const donutData = Object.entries(catGroups).map(([name, v], index) => ({
    name,
    value: v.total,
    color: categoryColors[name] || "#94a3b8",
    id: `${name}-${index}`, // Add unique ID to prevent duplicate key warnings
  }));

  // Recent alerts (low/out of stock)
  const alerts = inventory.filter((i) => i.stockStatus !== "In Stock");

  // Generate recent activity from actual database data
  const recentActivity = (() => {
    const activities = [];
    
    // Get recent assignments (last 5)
    const recentAssignments = [...assignments]
      .sort((a, b) => new Date(b.dateAssigned || 0).getTime() - new Date(a.dateAssigned || 0).getTime())
      .slice(0, 5);
    
    recentAssignments.forEach(assignment => {
      if (assignment.status === "Assigned") {
        activities.push({
          id: `assign-${assignment.assignmentId}`,
          type: "assignment",
          action: "New Assignment",
          description: assignment.assetName,
          assignedTo: assignment.assignedTo,
          timestamp: formatTimestamp(assignment.dateAssigned),
          icon: UserPlus,
          iconBg: "bg-green-50",
          iconColor: "text-green-500",
          date: new Date(assignment.dateAssigned || 0),
        });
      } else if (assignment.status === "Under Maintenance") {
        activities.push({
          id: `maint-${assignment.assignmentId}`,
          type: "maintenance",
          action: "Maintenance Scheduled",
          description: assignment.assetName,
          assignedTo: assignment.assignedTo,
          timestamp: formatTimestamp(assignment.dateAssigned),
          icon: Wrench,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500",
          date: new Date(assignment.dateAssigned || 0),
        });
      }
    });
    
    // Get low/out of stock items
    const lowStockItems = inventory
      .filter(item => item.stockStatus === "Low Stock" || item.stockStatus === "Out of Stock")
      .slice(0, 3);
    
    lowStockItems.forEach(item => {
      activities.push({
        id: `stock-${item.id}`,
        type: "inventory",
        action: item.stockStatus === "Out of Stock" ? "Stock Alert" : "Stock Updated",
        description: item.assetName,
        assignedTo: item.stockStatus === "Out of Stock" ? "Out of stock" : "Low stock alert",
        timestamp: "Recently",
        icon: item.stockStatus === "Out of Stock" ? XCircle : AlertTriangle,
        iconBg: item.stockStatus === "Out of Stock" ? "bg-red-50" : "bg-amber-50",
        iconColor: item.stockStatus === "Out of Stock" ? "text-red-500" : "text-amber-500",
        date: new Date(),
      });
    });
    
    // Sort by date and return top 6
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);
  })();
  
  // Helper function to format timestamps
  function formatTimestamp(dateString?: string): string {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-4 md:p-5 relative overflow-hidden hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300"
            >
              {card.badge && (
                <span className={`absolute top-2 md:top-3 right-2 md:right-3 text-[9px] font-semibold px-1.5 py-0.5 rounded ${card.badge.style}`}>
                  {card.badge.text}
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className={`${card.iconBg} ${card.iconColor} p-2 md:p-2.5 rounded-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-800 mt-0.5">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Donut – Category Breakdown */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-4 md:p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 md:mb-4">Stock by Category</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {donutData.map((d, idx) => (
                    <Cell key={`cell-${d.name}-${idx}`} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 md:gap-x-6 gap-y-1.5 w-full px-2 mt-1">
              {donutData.map((d, i) => (
                <div key={`legend-${d.name}-${i}`} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] md:text-[11px] text-gray-600 truncate">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar – Inventory Trend */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-4 md:p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 md:mb-4">Inventory Trend</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyData} barSize={26}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 80]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }}
                cursor={{ fill: "rgba(176,191,0,0.08)" }}
              />
              <Bar dataKey="items" fill="#B0BF00" radius={[4, 4, 0, 0]} name="Items" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Stock Alerts */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-4 md:p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Stock Alerts</h3>
            <button
              onClick={() => navigate("/dashboard/inventory")}
              className="text-xs text-[#B0BF00] hover:underline font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {alerts.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">All items are well stocked.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.assetName}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 hidden sm:inline">Qty: {item.quantity}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      item.stockStatus === "Out of Stock"
                        ? "bg-red-50 text-red-500"
                        : "bg-amber-50 text-amber-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.stockStatus === "Out of Stock" ? "bg-red-400" : "bg-amber-400"}`} />
                      <span className="hidden sm:inline">{item.stockStatus}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Overview */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-4 md:p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-sm font-semibold text-gray-800">Type Overview</h3>
          </div>
          <div className="space-y-2.5">
            {donutData.map((d, i) => {
              const Icon = categoryIcons[d.name] || Package;
              const pct = totalValue > 0 ? Math.round((d.value / donutData.reduce((s, x) => s + x.value, 0)) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${d.color}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700">{d.name}</span>
                      <span className="text-[10px] text-gray-400">{d.value} units</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgba(176,191,0,0.08)] border border-[#B0BF00]/20 p-4 md:p-5 hover:shadow-[0_8px_30px_rgba(176,191,0,0.15)] transition-all duration-300">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Last 48 hours</span>
          </div>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/60 backdrop-blur-lg border border-gray-100 hover:border-[#B0BF00]/30 hover:shadow-sm transition-all"
              >
                <div className={`${activity.iconBg} ${activity.iconColor} p-2 rounded-lg flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-800">{activity.action}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{activity.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-700 mb-0.5">{activity.description}</p>
                  <p className="text-[10px] text-gray-500">{activity.assignedTo}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}