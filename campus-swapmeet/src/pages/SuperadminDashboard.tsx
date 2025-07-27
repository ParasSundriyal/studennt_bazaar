import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Star,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Helper to get API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = (path: string) => `${API_URL}${path}`;

const SuperadminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      try {
        const [statsRes, usersRes, reportsRes, activityRes, sellersRes, productsRes] = await Promise.all([
          fetch(api('/users/stats'), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(api('/users/'), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(api('/reports/'), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(api('/admin/recent-activity'), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(api('/seller/pending'), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(api('/products/all'), { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        const reportsData = await reportsRes.json();
        const activityData = await activityRes.json();
        const sellersData = await sellersRes.json();
        const productsData = await productsRes.json();
        if (statsData.success && usersData.success && reportsData.success && activityData.success && sellersData.success && productsData.success) {
          setStats(statsData.stats);
          setUsers(usersData.users);
          setReports(reportsData.reports);
          setRecentActivity(activityData.activities);
          setPendingSellers(sellersData.pending);
          setAllProducts(productsData.products);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
      }
      setLoading(false);
    };
    fetchAll();
    // Polling interval
    const interval = setInterval(() => {
      fetchAll();
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (id: number) => {
    // TODO: Implement approve functionality
  };

  const handleReject = (id: number) => {
    // TODO: Implement reject functionality
  };

  const handleApproveSeller = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(api(`/seller/approve/${userId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Seller Approved', description: 'The student is now a seller.', variant: 'success' });
        setPendingSellers(prev => prev.filter(s => s._id !== userId));
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to approve seller', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to approve seller', variant: 'destructive' });
    }
  };

  const handleRejectSeller = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(api(`/seller/reject/${userId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Seller Rejected', description: 'The application has been rejected.', variant: 'destructive' });
        setPendingSellers(prev => prev.filter(s => s._id !== userId));
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to reject seller', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to reject seller', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleteLoading(productId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(api(`/products/${productId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Product Deleted', description: 'The product has been deleted.', variant: 'default' });
        setAllProducts(prev => prev.filter(p => p._id !== productId));
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to delete product', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
    setDeleteLoading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!stats || !users || !reports) {
    return <div className="text-center py-12">No data available.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-primary-foreground/80">Welcome back, {user?.name}</p>
          </div>
          <Button variant="destructive" size="sm" className="mt-4 md:mt-0" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="w-full flex flex-wrap gap-2 md:grid md:grid-cols-5 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allProducts">All Products</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="pendingSellers">Pending Sellers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalActiveListings}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPendingReviews}</div>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReports}</div>
                  <p className="text-xs text-muted-foreground">Require review</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 && <div className="text-muted-foreground">No recent activity.</div>}
                  {recentActivity.map((activity: any) => (
                    <div key={activity.date + activity.message} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${activity.type === 'user' ? 'bg-green-500' : activity.type === 'product' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allProducts" className="space-y-6">
            <h2 className="text-2xl font-bold">All Products</h2>
            <div className="grid gap-6">
              {allProducts.length === 0 && <div className="text-muted-foreground">No products found.</div>}
              {allProducts.map((product: any) => (
                <Card key={product._id}>
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={product.images && product.images[0]} alt={product.title} className="w-20 h-20 object-cover rounded-lg" />
                      <div>
                        <h3 className="font-semibold text-lg">{product.title}</h3>
                        <div className="text-sm text-muted-foreground">by {product.seller?.name || 'Unknown'} ({product.seller?.collegeId || 'N/A'})</div>
                        <div className="text-xl font-bold text-primary">₹{product.price?.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Listed on {new Date(product.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product._id)} disabled={deleteLoading === product._id}>
                        <X className="w-4 h-4 mr-2" />
                        {deleteLoading === product._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            
            <div className="grid gap-6">
              {users.map((userData: any) => (
                <Card key={userData._id}>
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{userData.name}</h3>
                      <p className="text-sm text-muted-foreground">{userData.email}</p>
                      <p className="text-sm text-muted-foreground">{userData.college}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <Badge className={userData.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {userData.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedUser(userData); setShowUserModal(true); }}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-bold">Reports & Issues</h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Critical Reports</h3>
                  <p className="text-muted-foreground">All reports have been resolved. Great job!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendingSellers" className="space-y-6">
            <h2 className="text-2xl font-bold">Pending Seller Applications</h2>
            <div className="grid gap-6">
              {pendingSellers.length === 0 && <div className="text-muted-foreground">No pending seller applications.</div>}
              {pendingSellers.map((seller: any) => (
                <Card key={seller._id}>
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{seller.name}</h3>
                      <p className="text-sm text-muted-foreground">College ID: {seller.collegeId}</p>
                      <p className="text-sm text-muted-foreground">College: {seller.collegeName}</p>
                      <p className="text-sm text-muted-foreground">Email: {seller.collegeEmail}</p>
                      <p className="text-sm text-muted-foreground">Phone: {seller.phoneNumber}</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button variant="default" size="sm" onClick={() => handleApproveSeller(seller._id)}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRejectSeller(seller._id)}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setShowUserModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">User Details</h3>
            <div className="space-y-2">
              <div><span className="font-medium">Name:</span> {selectedUser.name}</div>
              <div><span className="font-medium">College ID:</span> {selectedUser.collegeId}</div>
              <div><span className="font-medium">College:</span> {selectedUser.collegeName || selectedUser.college}</div>
              <div><span className="font-medium">Email:</span> {selectedUser.collegeEmail || selectedUser.email}</div>
              <div><span className="font-medium">Phone:</span> {selectedUser.phoneNumber || selectedUser.phone}</div>
              <div><span className="font-medium">Role:</span> {selectedUser.role}</div>
              <div><span className="font-medium">Seller Status:</span> {selectedUser.sellerStatus}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminDashboard;