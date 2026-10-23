import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'; 

// --- MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { 
  AlertTriangle, Package, HeartPulse, Home, Plus, CheckCircle2, 
  Activity, MapPin, Clock, ShieldAlert, ChevronDown, LogOut 
} from 'lucide-react';

// Map par Lal Pin (Marker) lagane ke liye
const markerIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function DisplaceOS() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');

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
    { item: "Tents (Family Size)", current: 120, total: 500, unit: "tents", color: "bg-amber-500" }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        lat: doc.data().lat || 28.6139 + (Math.random() - 0.5) * 0.15,
        lng: doc.data().lng || 77.2090 + (Math.random() - 0.5) * 0.15,
        ...doc.data()
      }));
      setRequests(fetchedRequests);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
      setEmail(''); setPassword('');
    } catch (error) {
      setAuthError("Error: Please check your details.");
    }
  };

  const handleLogout = async () => signOut(auth);

  const handleAllocate = async (id) => {
    const requestRef = doc(db, 'requests', id);
    await updateDoc(requestRef, { status: 'Allocated' });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.campName || !newRequest.amount) return;
    
    const mockLat = 28.6139 + (Math.random() - 0.5) * 0.2;
    const mockLng = 77.2090 + (Math.random() - 0.5) * 0.2;

    await addDoc(collection(db, 'requests'), {
      camp: newRequest.campName,
      resource: newRequest.resourceType,
      amount: newRequest.amount,
      urgency: newRequest.urgency,
      lat: mockLat,
      lng: mockLng,
      time: "Just now", 
      status: "Pending",
      createdAt: serverTimestamp()
    });
    setIsModalOpen(false);
    setNewRequest({ campName: '', resourceType: 'Food Packets', amount: '', urgency: 'High' });
  };

  const getUrgencyBadge = (urgency) => {
    if(urgency === 'Critical') return 'bg-red-100 text-red-800 border-red-200';
    if(urgency === 'High') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

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
            {authError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{authError}</div>}
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg shadow-sm">{isLoginMode ? 'Sign In' : 'Sign Up'}</button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-500">
              <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} className="text-orange-600 hover:text-orange-700 font-semibold">
                {isLoginMode ? 'Sign Up instead' : 'Sign In instead'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-gradient-to-r from-red-800 to-orange-600 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-8 w-8 text-white" strokeWidth={2.5} />
              <span className="text-2xl font-bold text-white tracking-tight">Displace<span className="font-light">OS</span></span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden lg:flex items-center text-white/80 text-sm mr-2">
                <Activity className="h-4 w-4 mr-2" /> Live Network: <span className="text-green-300 font-semibold ml-1">Optimal</span>
              </div>
              <select value={activeRole} onChange={(e) => setActiveRole(e.target.value)} className="hidden sm:block appearance-none bg-white/10 border border-white/20 text-white py-1.5 pl-3 pr-8 rounded-md focus:outline-none text-sm cursor-pointer">
                <option className="text-slate-900">Government Agency</option>
                <option className="text-slate-900">Rescue Team</option>
                <option className="text-slate-900">Relief Camp</option>
              </select>
              <button onClick={handleLogout} className="flex items-center bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-md text-sm transition-colors"><LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coordination Dashboard</h1>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"><Plus className="h-5 w-5 mr-1" /> Create Request</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center space-x-4">
              <div className={`p-4 rounded-full ${stat.bg}`}><stat.icon className={`h-8 w-8 ${stat.color}`} /></div>
              <div><p className="text-sm font-medium text-slate-500">{stat.title}</p><p className="text-2xl font-bold text-slate-900">{stat.value}</p></div>
            </div>
          ))}
        </div>

        {/* NAYA MAP SECTION */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative z-0">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 mr-2 text-red-500" />
            <h2 className="text-xl font-bold text-slate-800">Live Disaster Map</h2>
          </div>
          <div className="h-[350px] w-full rounded-lg overflow-hidden border border-slate-200 relative z-0">
            <MapContainer center={[28.6139, 77.2090]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {requests.filter(r => r.status === 'Pending').map((request) => (
                <Marker key={request.id} position={[request.lat, request.lng]} icon={markerIcon}>
                  <Popup>
                    <strong>{request.camp}</strong><br/>
                    Needs: {request.amount} {request.resource}<br/>
                    <span className="text-orange-600 font-bold">Urgency: {request.urgency}</span>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800"><AlertTriangle className="h-5 w-5 inline mr-2 text-orange-500" />Active Resource Requests</h2>
              <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">{requests.filter(r => r.status === 'Pending').length} Pending</span>
            </div>
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-lg">{req.resource}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getUrgencyBadge(req.urgency)}`}>{req.urgency}</span>
                    </div>
                    <div className="flex text-sm text-slate-600 gap-4">
                      <span><MapPin className="h-4 w-4 inline mr-1" />{req.camp}</span>
                      <span><Package className="h-4 w-4 inline mr-1" />{req.amount}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {req.status === 'Pending' ? (
                      <button onClick={() => handleAllocate(req.id)} disabled={activeRole === 'Relief Camp'} className="px-6 py-2 rounded-lg font-medium border-2 border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed">Allocate</button>
                    ) : (
                      <div className="px-6 py-2 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="h-5 w-5 inline mr-2" />Allocated</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-xl font-bold text-slate-800 pb-2 border-b"><Package className="h-5 w-5 inline mr-2 text-slate-500" />Inventory</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
              {inventory.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-semibold">{item.item}</span><span className="text-slate-500">{item.current} / {item.total} {item.unit}</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5"><div className={`${item.color} h-2.5 rounded-full`} style={{ width: `${(item.current/item.total)*100}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between"><h3 className="font-bold">New Request</h3><button onClick={() => setIsModalOpen(false)} className="text-xl">&times;</button></div>
            <form onSubmit={handleSubmitRequest} className="p-4 space-y-4">
              <input type="text" required placeholder="Camp Name" value={newRequest.campName} onChange={e => setNewRequest({...newRequest, campName: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-orange-500" />
              <select value={newRequest.resourceType} onChange={e => setNewRequest({...newRequest, resourceType: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-orange-500"><option>Food Packets</option><option>Medicines</option><option>Water</option><option>Tents</option></select>
              <input type="text" required placeholder="Amount" value={newRequest.amount} onChange={e => setNewRequest({...newRequest, amount: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-orange-500" />
              <select value={newRequest.urgency} onChange={e => setNewRequest({...newRequest, urgency: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-orange-500"><option>Critical</option><option>High</option><option>Medium</option></select>
              <button type="submit" className="w-full bg-orange-600 text-white p-2 rounded font-medium hover:bg-orange-700">Submit Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}