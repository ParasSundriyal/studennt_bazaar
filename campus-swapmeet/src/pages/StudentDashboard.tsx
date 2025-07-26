import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Package, ShoppingCart, Star, MapPin, Edit, Eye, Heart, TrendingUp, LogOut, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Webcam from 'react-webcam';
import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

// Helper to get API URL
const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = (path: string) => `${API_URL}${path}`;

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("selling");
  const [sellingItems, setSellingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellerStatus, setSellerStatus] = useState(user?.role === 'student' ? 'approved' : user?.sellerStatus || 'student');
  const [applyLoading, setApplyLoading] = useState(false);
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    images: [] as File[]
  });
  const [addLoading, setAddLoading] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean, product: any | null }>({ open: false, product: null });
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '', category: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<any>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryClick = () => {
    if (galleryInputRef.current) galleryInputRef.current.click();
  };
  const handleCameraClick = () => {
    setShowCamera(true);
  };
  const handleCapturePhoto = () => {
    if (webcamRef.current && addForm.images.length < 4) {
      const imageSrc = webcamRef.current.getScreenshot();
      // Convert base64 to File
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `photo-${Date.now()}.png`, { type: 'image/png' });
            setAddForm(prev => ({ ...prev, images: [...prev.images, file].slice(0, 4) }));
          });
      }
      setShowCamera(false);
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 4 - addForm.images.length);
      setAddForm(prev => ({ ...prev, images: [...prev.images, ...files].slice(0, 4) }));
    }
  };
  const handleRemoveImage = (idx: number) => {
    setAddForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  useEffect(() => {
    const fetchSellingItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(api('/products/my'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSellingItems(data.products);
        } else {
          setError('Failed to fetch listings');
        }
      } catch (err) {
        setError('Failed to fetch listings');
      }
      setLoading(false);
    };
    fetchSellingItems();
  }, []);

  const handleRegisterSeller = async () => {
    setApplyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api('/seller/apply'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSellerStatus('pending');
        toast({ title: 'Application Sent', description: 'Your request has been sent to the superadmin.', variant: 'default' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to apply as seller', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to apply as seller', variant: 'destructive' });
    }
    setApplyLoading(false);
  };

  const handleAddFormChange = (field: string, value: any) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', addForm.title);
      formData.append('description', addForm.description);
      formData.append('price', addForm.price);
      formData.append('category', addForm.category);
      addForm.images.forEach((img) => formData.append('images', img));
      // Always add user location if available
      if (user?.location) {
        formData.set('location', JSON.stringify(user.location));
      }
      const res = await fetch(api('/products/'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Product Added', description: 'Your product has been listed.', variant: 'default' });
        setShowAddModal(false);
        setAddForm({ title: '', description: '', price: '', category: '', images: [] });
        // Refresh listings
        setSellingItems(prev => [data.product, ...prev]);
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to add product', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add product', variant: 'destructive' });
    }
    setAddLoading(false);
  };

  const openEditModal = (product: any) => {
    setEditForm({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
    });
    setEditModal({ open: true, product });
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.product) return;
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api(`${api('/products')}/${editModal.product._id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Product Updated', description: 'Your product has been updated.', variant: 'default' });
        setEditModal({ open: false, product: null });
        setSellingItems(prev => prev.map(p => p._id === data.product._id ? data.product : p));
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to update product', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
    setEditLoading(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleteLoading(productId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api(`${api('/products')}/${productId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Product Deleted', description: 'Your product has been deleted.', variant: 'default' });
        setSellingItems(prev => prev.filter(p => p._id !== productId));
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to delete product', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
    setDeleteLoading(null);
  };

  const categories = [
    'Electronics', 'Books', 'Home & Living', 'Fashion', 'Sports', 'Other'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'sold': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [showBuyModal, setShowBuyModal] = useState<{ open: boolean, product: any | null }>({ open: false, product: null });
  const [buyMessage, setBuyMessage] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);

  const handleOpenBuyModal = (product: any) => {
    setShowBuyModal({ open: true, product });
    setBuyMessage('');
  };
  const handleSendBuyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api(`/products/${showBuyModal.product._id}/buy-request`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: buyMessage })
      });
      const data = await res.json();
      if (data.success) {
        setShowBuyModal({ open: false, product: null });
        toast({ title: 'Request Sent', description: 'Your buy request has been sent to the seller.', variant: 'default' });
        // Always re-fetch seller buy requests after sending
        fetchBuyRequests();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to send buy request', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send buy request', variant: 'destructive' });
    }
    setBuyLoading(false);
  };

  const [buyRequests, setBuyRequests] = useState<any[]>([]);
  const [buyReqLoading, setBuyReqLoading] = useState(false);
  const [buyReqActionLoading, setBuyReqActionLoading] = useState<string | null>(null);

  const fetchBuyRequests = async () => {
    setBuyReqLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api('/products/buy-requests/seller'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBuyRequests(data.requests);
    } catch {}
    setBuyReqLoading(false);
  };

  const handleBuyReqAction = async (id: string, action: 'approve' | 'reject') => {
    setBuyReqActionLoading(id + action);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api(`/products/buy-requests/${id}/${action}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBuyRequests(prev => prev.map(r => r._id === id ? { ...r, status: data.request.status } : r));
        toast({ title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: `You have ${action}d the buy request.`, variant: action === 'approve' ? 'default' : 'destructive' });
      }
    } catch {}
    setBuyReqActionLoading(null);
  };

  useEffect(() => {
    if (user?.role === 'student' && sellerStatus === 'approved') fetchBuyRequests();
  }, [user, sellerStatus]);

  const [myBuyRequests, setMyBuyRequests] = useState<any[]>([]);
  const [myBuyReqLoading, setMyBuyReqLoading] = useState(false);

  const fetchMyBuyRequests = async () => {
    setMyBuyReqLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api('/products/buy-requests/buyer'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMyBuyRequests(data.requests);
    } catch {}
    setMyBuyReqLoading(false);
  };

  useEffect(() => {
    fetchMyBuyRequests();
  }, [user]);

  useEffect(() => {
    const fetchSellingItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(api('/products/my'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSellingItems(data.products);
        } else {
          setError('Failed to fetch listings');
        }
      } catch (err) {
        setError('Failed to fetch listings');
      }
      setLoading(false);
    };
    const fetchMarketplaceItems = async () => {
      try {
        const res = await fetch(api('/products/'));
        const data = await res.json();
        if (data.success) {
          setMarketplaceItems(data.products.filter((p: any) => p.status === 'active' && p.seller && p.seller._id !== user?.id));
        }
      } catch {}
    };
    fetchSellingItems();
    fetchMarketplaceItems();
    // Polling interval
    const interval = setInterval(() => {
      fetchSellingItems();
      fetchMarketplaceItems();
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [user]);

  const [dashboardStats, setDashboardStats] = useState({ itemsSold: '-', itemsBought: '-', totalEarned: '-', profileViews: '-' });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(api('/users/dashboard-stats'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setDashboardStats({
            itemsSold: data.stats.itemsSold,
            itemsBought: data.stats.itemsBought,
            totalEarned: data.stats.totalEarned,
            profileViews: data.stats.profileViews
          });
        }
      } catch {}
      setStatsLoading(false);
    };
    fetchStats();
  }, [user]);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(user?.location || null);
  const [locationTouched, setLocationTouched] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [modalMapCenter, setModalMapCenter] = useState<[number, number]>(user?.location ? [user.location.lat, user.location.lng] : [28.6139, 77.209]);

  // Helper to reverse geocode lat/lng to address (using Nominatim API)
  // const fetchAddress = async (lat: number, lng: number) => {
  //   try {
  //     const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
  //     const data = await res.json();
  //     return data.display_name || '';
  //   } catch {
  //     return '';
  //   }
  // };

  // Custom marker icon
  const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  // Map click handler for modal
  function LocationSelector() {
    useMapEvents({
      click: async (e) => {
        setLocationTouched(true);
        setLocation({ lat: e.latlng.lat, lng: e.latlng.lng, address: '' }); // address will be filled by backend
        setShowLocationModal(false);
        // Save to backend
        const token = localStorage.getItem('token');
        await fetch(api('/users/me/location'), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }),
        });
        // Optionally update user context here if needed
      },
    });
    return null;
  }

  // Map auto-center helper
  function MapAutoCenter({ center }: { center: [number, number] }) {
    const map = useMap();
    React.useEffect(() => {
      map.setView(center);
    }, [center, map]);
    return null;
  }

  // Auto-detect location when modal opens
  React.useEffect(() => {
    if (showLocationModal && !locationTouched && !location) {
      setIsDetectingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ lat: latitude, lng: longitude, address: '' }); // address will be filled by backend
            setModalMapCenter([latitude, longitude]);
            setIsDetectingLocation(false);
          },
          () => {
            setIsDetectingLocation(false);
            setModalMapCenter([28.6139, 77.209]);
          }
        );
      } else {
        setIsDetectingLocation(false);
        setModalMapCenter([28.6139, 77.209]);
      }
    } else if (showLocationModal && location) {
      setModalMapCenter([location.lat, location.lng]);
    }
  }, [showLocationModal]);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Add distance filter state
  const [marketplaceDistance, setMarketplaceDistance] = useState<number>(0); // 0 = all
  const distanceOptions = [0, 1, 5, 10, 20, 50, 100]; // 0 = All, then km options

  // Haversine formula
  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <Avatar className="w-20 h-20 border-4 border-primary-foreground/20 mx-auto md:mx-0" >
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-2xl font-bold bg-primary-foreground text-primary">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.name}</h1>
              <p className="text-primary-foreground/80 text-base sm:text-lg">{user?.college}</p>
              {location && location.address && (
                <div className="flex items-center gap-2 text-sm text-primary-foreground/80 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location.address}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-4 mt-2 text-sm">
                <span>{user?.course} • {user?.year}</span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>4.8 Rating</span>
                </div>
              </div>
              {user?.role === 'student' && sellerStatus !== 'approved' && (
                <Button
                  variant="hero"
                  size="sm"
                  onClick={handleRegisterSeller}
                  disabled={applyLoading || sellerStatus === 'pending'}
                  className="mt-4"
                >
                  {sellerStatus === 'pending' ? 'Application Pending' : applyLoading ? 'Applying...' : 'Register as Seller'}
                </Button>
              )}
            </div>
            <div className="flex flex-row md:flex-col gap-2 justify-center md:justify-start">
            <Button variant="secondary" size="sm" onClick={() => setShowEditProfileModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
              <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            </div>
          </div>
          {/* Stats - TODO: Replace with real data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{statsLoading ? '-' : dashboardStats.itemsSold}</div>
              <div className="text-sm text-primary-foreground/80">Items Sold</div>
            </CardContent>
          </Card>
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{statsLoading ? '-' : dashboardStats.itemsBought}</div>
              <div className="text-sm text-primary-foreground/80">Items Bought</div>
            </CardContent>
          </Card>
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{statsLoading ? '-' : (dashboardStats.totalEarned !== '-' ? `₹${dashboardStats.totalEarned}` : '-')}</div>
              <div className="text-sm text-primary-foreground/80">Total Earned</div>
            </CardContent>
          </Card>
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{statsLoading ? '-' : dashboardStats.profileViews}</div>
              <div className="text-sm text-primary-foreground/80">Profile Views</div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
      {/* Dashboard Content */}
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList
            className="flex flex-nowrap gap-2 overflow-x-auto w-full mb-4 bg-white/60 rounded-lg p-1 sm:justify-center sm:gap-4 text-sm sm:text-base scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300"
          >
            <TabsTrigger value="selling" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>My Listings</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="buyRequests" className="flex items-center space-x-2">
              <span>Buy Requests</span>
            </TabsTrigger>
            <TabsTrigger value="myBuyRequests" className="flex items-center space-x-2">
              <span>My Buy Requests</span>
            </TabsTrigger>
            <TabsTrigger value="buying" className="flex items-center space-x-2">
              <span>Purchase History</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="selling" className="space-y-4 sm:space-y-6">
            {user?.role === 'student' && sellerStatus !== 'approved' ? (
              <div className="text-center text-muted-foreground">
                {sellerStatus === 'pending'
                  ? 'Your seller application is pending approval. You will be able to list products once approved.'
                  : 'You must be an approved seller to list products. Please apply using the button above.'}
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-2 sm:mt-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">My Listings</h2>
              <Button variant="hero" className="w-full sm:w-auto" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Item
              </Button>
            </div>
            {loading && <div>Loading your listings...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && sellingItems.length === 0 && (
              <div className="text-muted-foreground">No listings found.</div>
            )}
            {!loading && !error && sellingItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellingItems.map((item: any) => (
                  <Card key={item._id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <img
                          src={item.images && item.images[0]}
                          alt={item.title}
                              className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg mx-auto sm:mx-0"
                        />
                        <div className="flex-1 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xl font-bold text-primary">₹{item.price?.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <span>Listed on {new Date(item.createdAt).toLocaleDateString()}</span>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(item._id)} disabled={deleteLoading === item._id}>
                                  <X className="w-4 h-4 mr-2" />
                                  {deleteLoading === item._id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                  </div>
            )}
            {/* Add Item Modal */}
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
                <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4 md:p-8 w-full max-w-md md:max-w-lg max-h-[95vh] overflow-auto relative flex flex-col">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowAddModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold mb-4">Add New Product</h3>
                  <form onSubmit={handleAddProduct} className="space-y-4 flex flex-col">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block mb-1 font-medium">Title</label>
                        <input type="text" className="w-full border rounded px-3 py-2" value={addForm.title} onChange={e => handleAddFormChange('title', e.target.value)} required />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1 font-medium">Price (INR)</label>
                        <input type="number" className="w-full border rounded px-3 py-2" value={addForm.price} onChange={e => handleAddFormChange('price', e.target.value)} required min={1} />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Description</label>
                      <textarea className="w-full border rounded px-3 py-2" value={addForm.description} onChange={e => handleAddFormChange('description', e.target.value)} required />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Category</label>
                      <select className="w-full border rounded px-3 py-2" value={addForm.category} onChange={e => handleAddFormChange('category', e.target.value)} required>
                        <option value="">Select category</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-medium">Images</label>
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <Button type="button" variant="outline" size="sm" onClick={handleGalleryClick} disabled={addForm.images.length >= 4}>
                          Choose from Gallery
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleCameraClick} disabled={addForm.images.length >= 4}>
                          Take Photo
                        </Button>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={galleryInputRef}
                        onChange={handleAddImages}
                        disabled={addForm.images.length >= 4}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        ref={cameraInputRef}
                        onChange={handleAddImages}
                        disabled={addForm.images.length >= 4}
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {addForm.images.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`preview-${idx}`}
                              className="w-full h-full object-cover rounded border"
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              onClick={() => handleRemoveImage(idx)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">You can upload or capture up to 4 images.</div>
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={addLoading}>
                      {addLoading ? 'Adding...' : 'Add Product'}
                    </Button>
                  </form>
                </div>
              </div>
            )}
                {showCamera && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md relative flex flex-col items-center">
                      <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowCamera(false)}>
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-xl font-bold mb-4">Take Photo</h3>
                      {React.createElement(Webcam as any, {
                        audio: false,
                        ref: webcamRef,
                        screenshotFormat: 'image/png',
                        videoConstraints: { facingMode: 'environment' },
                        className: 'rounded border w-full h-64 object-cover',
                      })}
                      <Button type="button" variant="hero" className="mt-4 w-full" onClick={handleCapturePhoto}>
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                )}
                {editModal.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
                    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md relative">
                      <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setEditModal({ open: false, product: null })}>
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-xl font-bold mb-4">Edit Product</h3>
                      <form onSubmit={handleEditProduct} className="space-y-4">
                        <div>
                          <label className="block mb-1 font-medium">Title</label>
                          <input type="text" className="w-full border rounded px-3 py-2" value={editForm.title} onChange={e => handleEditFormChange('title', e.target.value)} required />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Description</label>
                          <textarea className="w-full border rounded px-3 py-2" value={editForm.description} onChange={e => handleEditFormChange('description', e.target.value)} required />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Price (INR)</label>
                          <input type="number" className="w-full border rounded px-3 py-2" value={editForm.price} onChange={e => handleEditFormChange('price', e.target.value)} required min={1} />
                        </div>
                        <div>
                          <label className="block mb-1 font-medium">Category</label>
                          <select className="w-full border rounded px-3 py-2" value={editForm.category} onChange={e => handleEditFormChange('category', e.target.value)} required>
                            <option value="">Select category</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        {!location && (
                          <Button variant="outline" className="mt-4 w-full" onClick={() => setShowLocationModal(true)}>
                            <MapPin className="w-4 h-4 mr-2" /> Set Location
                          </Button>
                        )}
                        <Button type="submit" variant="hero" className="w-full" disabled={editLoading}>
                          {editLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-2xl font-bold">Marketplace</h2>
              <Button variant="outline" size="sm" onClick={() => {
                // Re-fetch marketplace items
                const fetchMarketplaceItems = async () => {
                  try {
                    const res = await fetch(api('/products/'));
                    const data = await res.json();
                    if (data.success) {
                      setMarketplaceItems(data.products.filter((p: any) => p.status === 'active' && p.seller && p.seller._id !== user?.id));
                    }
                  } catch {}
                };
                fetchMarketplaceItems();
              }}>Refresh</Button>
              {/* Distance filter dropdown, only if user has location */}
              {user?.location && (
                <div className="flex items-center gap-2">
                  <label htmlFor="distance-filter" className="text-sm">Within</label>
                  <select
                    id="distance-filter"
                    className="border rounded px-2 py-1 text-sm"
                    value={marketplaceDistance}
                    onChange={e => setMarketplaceDistance(Number(e.target.value))}
                  >
                    <option value={0}>All</option>
                    {distanceOptions.filter(d => d !== 0).map(d => (
                      <option key={d} value={d}>{d} km</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceItems.length === 0 && (
                <div className="text-muted-foreground">
                  No products found.
                  {(!user?.location || marketplaceItems.every((item: any) => !item.location)) && (
                    <div className="text-xs text-warning mt-2">Some products or your profile may be missing location data. Set your location in your profile for better results.</div>
                  )}
                </div>
              )}
              {marketplaceItems
                .filter((item: any) => item.seller && item.seller._id !== user?.id)
                .filter((item: any) => {
                  // Show all products if distance is 'All'
                  if (!user?.location || !item.location || !item.location.lat || !item.location.lng) {
                    return marketplaceDistance === 0;
                  }
                  if (!marketplaceDistance || marketplaceDistance === 0) return true;
                  const dist = getDistanceFromLatLonInKm(
                    user.location.lat,
                    user.location.lng,
                    item.location.lat,
                    item.location.lng
                  );
                  return dist <= marketplaceDistance;
                })
                .map((item: any) => (
                  <Card key={item._id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <img
                          src={item.images && item.images[0]}
                          alt={item.title}
                          className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg mx-auto sm:mx-0"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xl font-bold text-primary">₹{item.price?.toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">by {item.seller?.name || 'Unknown'}</div>
                              {/* Show distance if user and product have location */}
                              {user?.location && item.location && item.location.lat && item.location.lng && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {getDistanceFromLatLonInKm(user.location.lat, user.location.lng, item.location.lat, item.location.lng).toFixed(2)} km away
                                </div>
                              )}
                            </div>
                          </div>
                          <span>Listed on {new Date(item.createdAt).toLocaleDateString()}</span>
                          <Button variant="hero" size="sm" className="mt-2" onClick={() => handleOpenBuyModal(item)}>
                            Send Buy Request
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="buyRequests" className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-4">Buy Requests
              <Button variant="outline" size="sm" onClick={fetchBuyRequests}>Refresh</Button>
            </h2>
            {buyReqLoading ? (
              <div>Loading buy requests...</div>
            ) : buyRequests.length === 0 ? (
              <div className="text-muted-foreground">No buy requests yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {buyRequests.map((req: any) => (
                  <Card key={req._id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold">Product: {req.product?.title}</div>
                        <div className="text-xs text-muted-foreground">by {req.buyer?.name} ({req.buyer?.collegeId})</div>
                        <div className="text-sm">Message: {req.message}</div>
                        <div className="text-xs">Status: <span className={req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}>{req.status}</span></div>
                        {req.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button variant="default" size="sm" onClick={() => handleBuyReqAction(req._id, 'approve')} disabled={buyReqActionLoading === req._id + 'approve'}>
                              {buyReqActionLoading === req._id + 'approve' ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleBuyReqAction(req._id, 'reject')} disabled={buyReqActionLoading === req._id + 'reject'}>
                              {buyReqActionLoading === req._id + 'reject' ? 'Rejecting...' : 'Reject'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="myBuyRequests" className="space-y-6">
            <h2 className="text-2xl font-bold">My Buy Requests</h2>
            {myBuyReqLoading ? (
              <div>Loading your buy requests...</div>
            ) : myBuyRequests.length === 0 ? (
              <div className="text-muted-foreground">No buy requests sent yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBuyRequests.map((req: any) => (
                  <Card key={req._id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col gap-2">
                        <div className="font-semibold">Product: {req.product?.title}</div>
                        <div className="text-xs text-muted-foreground">Seller: {req.seller?.name} ({req.seller?.collegeId})</div>
                        <div className="text-sm">Message: {req.message}</div>
                        <div className="text-xs">Status: <span className={req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}>{req.status}</span></div>
                        {req.status === 'approved' && <div className="text-green-700 font-semibold">Your request was approved! Please contact the seller to proceed.</div>}
                        {req.status === 'rejected' && <div className="text-red-700 font-semibold">Your request was rejected.</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="buying" className="space-y-6">
            <h2 className="text-2xl font-bold">Purchase History</h2>
            <div className="grid gap-6">
              {/* TODO: Implement real purchase history */}
              <div className="text-muted-foreground">Coming soon...</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {showBuyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md relative flex flex-col">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowBuyModal({ open: false, product: null })}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">Send Buy Request</h3>
            <form onSubmit={handleSendBuyRequest} className="space-y-4 flex flex-col">
              <div>
                <label className="block mb-1 font-medium">Message/Offer to Seller</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={buyMessage}
                  onChange={e => setBuyMessage(e.target.value)}
                  required
                  placeholder="Type your offer or message to the seller..."
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={buyLoading}>
                {buyLoading ? 'Sending...' : 'Send Request'}
              </Button>
            </form>
          </div>
        </div>
      )}
      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowEditProfileModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setProfileLoading(true);
              const token = localStorage.getItem('token');
              const res = await fetch(api('/users/me'), {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
              });
              const data = await res.json();
              setProfileLoading(false);
              if (data.success) {
                toast({ title: 'Profile Updated', description: 'Your profile has been updated.', variant: 'default' });
                setShowEditProfileModal(false);
                // Optionally update user context here
              } else {
                toast({ title: 'Error', description: data.message || 'Failed to update profile', variant: 'destructive' });
              }
            }} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              {/* Only allow setting location if not set */}
              {!location && (
                <Button variant="outline" className="mt-2 w-full" onClick={(e) => { e.preventDefault(); setShowLocationModal(true); }}>
                  <MapPin className="w-4 h-4 mr-2" /> Set Location
                </Button>
              )}
              <Button type="submit" variant="hero" className="w-full" disabled={profileLoading}>
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>
      )}
      {/* Map Modal for setting location */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="flex flex-row items-center justify-between px-6 pt-6">
            <DialogTitle>Select Your Location</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowLocationModal(false)}>
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <div className="h-80 sm:h-96 w-full rounded-lg overflow-hidden border border-gray-300 mt-2 relative flex">
            {isDetectingLocation && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Detecting your location...
              </div>
            )}
            <MapContainer
              center={modalMapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              className="flex-1 min-w-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapAutoCenter center={modalMapCenter} />
              <LocationSelector />
              {location && <Marker position={[location.lat, location.lng]} icon={markerIcon} />}
            </MapContainer>
          </div>
          <DialogFooter className="px-6 pb-4 pt-2">
            <div className="text-xs text-muted-foreground">
              Click on the map to set your location. Your address will appear in the profile.
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;