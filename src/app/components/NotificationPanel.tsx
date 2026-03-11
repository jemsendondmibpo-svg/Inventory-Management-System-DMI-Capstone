import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, AlertTriangle, AlertCircle, PackageX, ChevronRight } from "lucide-react";
import { useInventory } from "../context/InventoryContext";
import { useNavigate } from "react-router";

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { inventory } = useInventory();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [position, setPosition] = useState({ top: 0, right: 0 });

  // Update position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate notifications
  const lowStockItems = inventory.filter((item) => item.stockStatus === "Low Stock");
  const outOfStockItems = inventory.filter((item) => item.stockStatus === "Out of Stock");
  const damagedItems = inventory.filter(
    (item) => item.condition === "Damaged" || item.condition === "Poor"
  );

  const totalNotifications = lowStockItems.length + outOfStockItems.length + damagedItems.length;

  const handleViewInventory = () => {
    setIsOpen(false);
    navigate("/dashboard/inventory");
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {totalNotifications > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {totalNotifications > 99 ? "99+" : totalNotifications}
          </span>
        )}
      </button>

      {/* Notification Panel Dropdown - Rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed w-80 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-[9999]"
            style={{ top: `${position.top}px`, right: `${position.right}px` }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  {totalNotifications} alerts
                </span>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {totalNotifications === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications</p>
                  <p className="text-xs text-gray-400 mt-1">All inventory items are in good condition</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Out of Stock Notifications */}
                  {outOfStockItems.length > 0 && (
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <PackageX className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                              Out of Stock
                            </h4>
                            <span className="text-xs text-white bg-red-500 px-1.5 py-0.5 rounded-full font-bold">
                              {outOfStockItems.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {outOfStockItems.slice(0, 3).map((item) => (
                              <p key={item.id} className="text-xs text-gray-600 truncate">
                                • {item.assetName} ({item.sku})
                              </p>
                            ))}
                            {outOfStockItems.length > 3 && (
                              <p className="text-xs text-gray-400 italic">
                                +{outOfStockItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Low Stock Notifications */}
                  {lowStockItems.length > 0 && (
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                              Low Stock
                            </h4>
                            <span className="text-xs text-white bg-orange-500 px-1.5 py-0.5 rounded-full font-bold">
                              {lowStockItems.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {lowStockItems.slice(0, 3).map((item) => (
                              <p key={item.id} className="text-xs text-gray-600 truncate">
                                • {item.assetName} - Qty: {item.quantity}/{item.minQuantity}
                              </p>
                            ))}
                            {lowStockItems.length > 3 && (
                              <p className="text-xs text-gray-400 italic">
                                +{lowStockItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Damaged Items Notifications */}
                  {damagedItems.length > 0 && (
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                              Damaged / Poor Condition
                            </h4>
                            <span className="text-xs text-white bg-yellow-500 px-1.5 py-0.5 rounded-full font-bold">
                              {damagedItems.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {damagedItems.slice(0, 3).map((item) => (
                              <p key={item.id} className="text-xs text-gray-600 truncate">
                                • {item.assetName} - {item.condition}
                              </p>
                            ))}
                            {damagedItems.length > 3 && (
                              <p className="text-xs text-gray-400 italic">
                                +{damagedItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {totalNotifications > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleViewInventory}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#B0BF00] hover:bg-[#9aaa00] text-white rounded-lg text-xs font-medium transition-colors"
                >
                  View Inventory
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}