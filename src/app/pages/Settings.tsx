import { useState } from "react";
import {
  User, Bell, ChevronRight,
  Mail, Phone, Building, Save, Check, Globe, MapPin,
  Briefcase, Building2, Info, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const sections = [
  { id: "personal", icon: User, label: "Personal Information", color: "text-blue-500", bg: "bg-gradient-to-br from-blue-50 to-blue-100/50", iconBg: "bg-blue-100" },
  { id: "company", icon: Building2, label: "Company Information", color: "text-purple-500", bg: "bg-gradient-to-br from-purple-50 to-purple-100/50", iconBg: "bg-purple-100" },
  { id: "notifications", icon: Bell, label: "Notifications", color: "text-amber-500", bg: "bg-gradient-to-br from-amber-50 to-amber-100/50", iconBg: "bg-amber-100" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("personal");
  const [profile, setProfile] = useState({
    name: user?.name || "Jeremy Sendon",
    email: user?.email || "jeremy.sendon@digitalmindsbpo.com",
    phone: "+63 917 123 4567",
    role: user?.role || "Admin",
    department: "IT Operations",
    position: "System Administrator",
    dateJoined: "January 15, 2024",
  });
  
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "Digital Minds BPO Services Inc.",
    businessType: "Business Process Outsourcing",
    industry: "Information Technology & Services",
    registrationNumber: "CS201234567",
    taxId: "123-456-789-000",
    email: "info@digitalmindsbpo.com",
    phone: "+63 2 8123 4567",
    website: "https://www.digitalmindsbpo.com",
    address: "Floor 8, IT Park Building, Cebu Business Park",
    city: "Cebu City",
    province: "Cebu",
    postalCode: "6000",
    country: "Philippines",
  });
  
  const [notifications, setNotifications] = useState({
    lowStock: true,
    outOfStock: true,
    newItem: false,
    weeklyReport: true,
    emailAlerts: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully.");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fieldClass = "w-full h-11 text-sm bg-white border-2 border-gray-200 rounded-xl px-4 outline-none focus:border-[#B0BF00] focus:ring-4 focus:ring-[#B0BF00]/10 text-gray-700 transition-all duration-200 hover:border-gray-300";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#B0BF00] to-[#8a9600] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Settings</h1>
            <p className="text-sm text-white/80 mt-0.5">Manage your personal and company information</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:sticky lg:top-4 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">Navigation</p>
            {sections.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    active 
                      ? "bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] text-white shadow-lg shadow-[#B0BF00]/30 scale-[1.02]" 
                      : "text-gray-600 hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      active ? "bg-white/20" : s.iconBg
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${active ? "text-white" : s.color}`} />
                    </div>
                    <span className="text-sm font-semibold">{s.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${active ? "text-white translate-x-1" : "text-gray-300 group-hover:translate-x-1"}`} />
                </button>
              );
            })}          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-4 space-y-6">          {/* Personal Information */}
          {activeSection === "personal" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 px-6 py-5 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Manage your account details and preferences</p>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" /> Full Name
                      </label>
                      <input 
                        className={fieldClass} 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Address
                      </label>
                      <input 
                        className={fieldClass} 
                        type="email" 
                        value={profile.email} 
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                        placeholder="your.email@company.com"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-500" /> Phone Number
                      </label>
                      <input 
                        className={fieldClass} 
                        value={profile.phone} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                        placeholder="+63 XXX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-500" /> Department
                      </label>
                      <input 
                        className={fieldClass} 
                        value={profile.department} 
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })} 
                        placeholder="Your department"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Role
                      </label>
                      <div className="relative">
                        <input 
                          className={`${fieldClass} bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500 cursor-not-allowed border-gray-200`} 
                          value={profile.role} 
                          readOnly 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            System Managed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">Your role is managed by the system administrator and cannot be changed from this panel.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] hover:from-[#9aaa00] hover:to-[#8a9600] text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-[#B0BF00]/30 hover:shadow-xl hover:shadow-[#B0BF00]/40 hover:scale-[1.02]"
                    >
                      {saved ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Saved Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Company Information */}
          {activeSection === "company" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100/30 px-6 py-5 border-b border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Company Information</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Configure your organization details and business information</p>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-500" /> Company Name
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.companyName} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} 
                          placeholder="Your company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-purple-500" /> Company Email
                        </label>
                        <input 
                          className={fieldClass} 
                          type="email" 
                          value={companyInfo.email} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} 
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-purple-500" /> Phone Number
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.phone} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })} 
                          placeholder="+63 XXX XXX XXXX"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-purple-500" /> Website
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.website} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })} 
                          placeholder="https://www.yourcompany.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" /> Street Address
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.address} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} 
                          placeholder="Building, Floor, Street"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" /> City
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.city} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })} 
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" /> Province
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.province} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, province: e.target.value })} 
                          placeholder="Province/State"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" /> Postal Code
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.postalCode} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })} 
                          placeholder="XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-purple-500" /> Country
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.country} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })} 
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Business Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Business Type
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.businessType} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, businessType: e.target.value })} 
                          placeholder="e.g., Corporation, LLC"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Industry
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.industry} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })} 
                          placeholder="Industry sector"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Registration Number
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.registrationNumber} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })} 
                          placeholder="Business registration #"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Tax ID
                        </label>
                        <input 
                          className={fieldClass} 
                          value={companyInfo.taxId} 
                          onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })} 
                          placeholder="Tax identification number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] hover:from-[#9aaa00] hover:to-[#8a9600] text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-[#B0BF00]/30 hover:shadow-xl hover:shadow-[#B0BF00]/40 hover:scale-[1.02]"
                    >
                      {saved ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Saved Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100/30 px-6 py-5 border-b border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Notification Preferences</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Control how and when you receive alerts and updates</p>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6">
                  <div className="space-y-1">
                    {[
                      { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when items fall below minimum quantity threshold", icon: "📊" },
                      { key: "outOfStock", label: "Out of Stock Alerts", desc: "Immediate alerts when items reach zero quantity", icon: "🚨" },
                      { key: "newItem", label: "New Item Added", desc: "Receive updates when a new item is added to inventory", icon: "✨" },
                      { key: "weeklyReport", label: "Weekly Reports", desc: "Receive comprehensive inventory summary every Monday morning", icon: "📈" },
                      { key: "emailAlerts", label: "Email Notifications", desc: "Send all alerts and notifications to your registered email address", icon: "📧" },
                    ].map((n, index) => (
                      <div key={n.key} className={`group hover:bg-gray-50 rounded-xl p-5 transition-all duration-200 ${index !== 4 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-2xl mt-1">{n.icon}</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800 group-hover:text-[#B0BF00] transition-colors">{n.label}</p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.desc}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 flex-shrink-0 shadow-inner ${
                              notifications[n.key as keyof typeof notifications] 
                                ? "bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] shadow-[#B0BF00]/30" 
                                : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                                notifications[n.key as keyof typeof notifications] ? "translate-x-8" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
                    <button 
                      onClick={handleSave} 
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B0BF00] to-[#9aaa00] hover:from-[#9aaa00] hover:to-[#8a9600] text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-[#B0BF00]/30 hover:shadow-xl hover:shadow-[#B0BF00]/40 hover:scale-[1.02]"
                    >
                      <Save className="w-5 h-5" /> 
                      <span>Save Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}