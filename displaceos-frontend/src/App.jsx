import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; // auth import kiya
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'; // Login functions

import { 
  AlertTriangle, Package, HeartPulse, Home, Plus, CheckCircle2, 
  Activity, MapPin, Clock, ShieldAlert, ChevronDown, LogOut 
} from 'lucide-react';

export default function DisplaceOS() {
  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // True = Login, False = Sign Up
  const [authError, setAuthError] = useState('');

  // --- DASHBOARD STATE ---
  const [activeRole, setActiveRole] = useState('Government Agency');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  
  const [newRequest, setNewRequest] = useState({
    campName: '',
    resourceType: 'Food Packets',
    amount: '',
    urgency: 'High'
  });

  const stats = [
    { title: "Total Food Packets", value: "24,500", icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Medical Kits", value: "3,250", icon: HeartPulse, color: "text-red-600", bg: "bg-red-100" },
    { title: "Available Shelter Capacity", value: "1,800", icon: Home, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const inventory = [
    { item: "MREs (Meals Ready-to-Eat)", current: 8500, total: 10000, unit: "units", color: "bg-orange-500" },
    { item: "Drinking Water (Liters)", current: 45000, total: 100000, unit: "L", color: "bg-blue-500" },
    { item: "First Aid Kits", current: 850, total: 2000, unit: "kits", color: "bg-red-500" },
    { item: "Tents (Family Size)", current: 120, total: 500, unit: "tents", color: "bg-amber-500" },
    { item: "Antibiotics & Essential Meds", current: 340, total: 1000, unit: "boxes", color: "bg-rose-500" }
  ];

  // 1. Listen for user login/logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data (Only if user is logged in)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, [user]);

  // --- AUTHENTICATION HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError("Error: Please check your details or try a simpler password.");
      console.error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // --- DASHBOARD HANDLERS ---
  const handleAllocate = async (id) => {
    try {
      const requestRef = doc(db, 'requests', id);
      await updateDoc(requestRef, { status: 'Allocated' });
    } catch (error) {
      console.error("Error allocating:", error);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.campName || !newRequest.amount) return;

    try {
      await addDoc(collection(db, 'requests'), {
        camp: newRequest.campName,
        resource: newRequest.resourceType,
        amount: newRequest.amount,
        urgency: newRequest.urgency,
        time: "Just now", 
        status: "Pending",
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewRequest({ campName: '', resourceType: 'Food Packets', amount: '', urgency: 'High' });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch(urgency) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ==========================================
  // LOGIN SCREEN (If user is not logged in)
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-red-800 to-orange-600 p-8 text-center">
            <ShieldAlert className="h-12 w-12 text-white mx-auto mb-3" strokeWidth={2} />
            <h1 className="text-3xl font-bold text-white tracking-tight">Displace<span className="font-light">OS</span></h1>
            <p className="text-white/80 mt-2 text-sm">Disaster Relief Coordination Platform</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
              {isLoginMode ? 'Sign In to Dashboard' : 'Create an Account'}
            </h2>
            
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="name@agency.gov"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
              >
                {isLoginMode ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setAuthError('');
                }}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                {isLoginMode ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD (If user IS logged in)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-red-800 to-orange-600 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-8 w-8 text-white" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-white tracking-tight">Displace<span className="font-light">OS</span></span>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden lg:flex items-center text-white/80 text-sm mr-2">
                <Activity className="h-4 w-4 mr-2" />
                Live Network Status: <span className="text-green-300 font-semibold ml-1">Optimal</span>
              </div>
              
              <div className="relative group hidden sm:block">
                <select 
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value)}
                  className="appearance-none bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 pl-4 pr-10 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors cursor-pointer backdrop-blur-sm font-medium text-sm"
                >
                  <option className="text-slate-900">Government Agency</option>
                  <option className="text-slate-900">Rescue Team</option>
                  <option className="text-slate-900">Relief Camp</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-white pointer-events-none" />
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-md transition-colors text-sm font-medium"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coordination Dashboard</h1>
            <p className="text-slate-500 mt-1">Real-time disaster relief management and resource allocation.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Create Request</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
                <div className={`p-4 rounded-full ${stat.bg}`}>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Active Resource Requests
              </h2>
              <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {requests.filter(r => r.status === 'Pending').length} Pending
              </span>
            </div>

            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
                  No active requests. Create one to see it appear live!
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-orange-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between sm:justify-start sm:space-x-3">
                        <h3 className="font-bold text-lg text-slate-900">{request.resource}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getUrgencyBadge(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-600 gap-2 sm:gap-6">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                          {request.camp}
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1 text-slate-400" />
                          Qty: <span className="font-semibold text-slate-900 ml-1">{request.amount}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-slate-400" />
                          {request.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0 border-slate-100">
                      {request.status === 'Pending' ? (
                        <button 
                          onClick={() => handleAllocate(request.id)}
                          disabled={activeRole === 'Relief Camp'} 
                          className={`w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-all shadow-sm
                            ${activeRole === 'Relief Camp' 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:shadow'}`}
                        >
                          Allocate
                        </button>
                      ) : (
                        <div className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200 flex items-center justify-center shadow-sm cursor-default">
                          <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                          Allocated
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Package className="h-5 w-5 mr-2 text-slate-500" />
                Network Inventory
              </h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
              {inventory.map((item, index) => {
                const percentage = Math.round((item.current / item.total) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-semibold text-slate-700">{item.item}</span>
                      <span className="text-slate-500 font-medium">
                        {item.current.toLocaleString()} / {item.total.toLocaleString()} <span className="text-xs">{item.unit}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 shadow-inner overflow-hidden">
                      <div 
                        className={`${item.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 mt-6">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>System Sync:</strong> Inventory levels are automatically synced across all connected district warehouses and government storage facilities.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Create Resource Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none font-light"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Camp / Location Name</label>
                <input 
                  type="text" 
                  required
                  value={newRequest.campName}
                  onChange={(e) => setNewRequest({...newRequest, campName: e.target.value})}
                  placeholder="e.g. Camp Beta (South Sector)"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Resource</label>
                  <select 
                    value={newRequest.resourceType}
                    onChange={(e) => setNewRequest({...newRequest, resourceType: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white"
                  >
                    <option>Food Packets</option>
                    <option>First Aid Kits</option>
                    <option>Drinking Water</option>
                    <option>Tents</option>
                    <option>Medicines</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount / Qty</label>
                  <input 
                    type="text" 
                    required
                    value={newRequest.amount}
                    onChange={(e) => setNewRequest({...newRequest, amount: e.target.value})}
                    placeholder="e.g. 500"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urgency Level</label>
                <div className="flex gap-4 mt-2">
                  {['Critical', 'High', 'Medium'].map((level) => (
                    <label key={level} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="urgency"
                        value={level}
                        checked={newRequest.urgency === level}
                        onChange={(e) => setNewRequest({...newRequest, urgency: e.target.value})}
                        className="text-orange-600 focus:ring-orange-500 h-4 w-4"
                      />
                      <span className="text-sm font-medium text-slate-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}