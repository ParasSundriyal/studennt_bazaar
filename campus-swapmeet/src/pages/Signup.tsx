import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React from 'react'; // Added missing import for React.createElement
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const colleges = [
  'Delhi University',
  'Jawaharlal Nehru University',
  'IIT Delhi',
  'BITS Pilani',
  'Jamia Millia Islamia',
  'University of Mumbai',
  'IIT Bombay',
  'University of Pune',
  'Bangalore University',
  'Other'
];

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year', 'Post Graduate'];

const Signup = () => {
  const [formData, setFormData] = useState({
    collegeId: '',
    password: '',
    confirmPassword: '',
    name: '',
    collegeName: '', // changed from college
    phoneNumber: '', // changed from phone
    year: '',
    course: '',
    collegeEmail: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string }>({ lat: 28.6139, lng: 77.209, address: '' });
  const [locationTouched, setLocationTouched] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [modalMapCenter, setModalMapCenter] = useState<[number, number]>([location.lat, location.lng]);

  // Helper to reverse geocode lat/lng to address (using Nominatim API)
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || '';
    } catch {
      return '';
    }
  };

  // Custom marker icon (fixes missing marker icon issue)
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
        const address = await fetchAddress(e.latlng.lat, e.latlng.lng);
        setLocation({ lat: e.latlng.lat, lng: e.latlng.lng, address });
        setShowLocationModal(false);
      },
    });
    return null;
  }

  // Map auto-center helper
  function MapAutoCenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center);
    }, [center, map]);
    return null;
  }

  // Auto-detect location when modal opens
  useEffect(() => {
    if (showLocationModal && !locationTouched) {
      setIsDetectingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            const address = await fetchAddress(latitude, longitude);
            setLocation({ lat: latitude, lng: longitude, address });
            setModalMapCenter([latitude, longitude]);
            setIsDetectingLocation(false);
          },
          () => {
            setIsDetectingLocation(false);
            setModalMapCenter([28.6139, 77.209]); // fallback to default
          }
        );
      } else {
        setIsDetectingLocation(false);
        setModalMapCenter([28.6139, 77.209]);
      }
    } else if (showLocationModal && locationTouched) {
      setModalMapCenter([location.lat, location.lng]);
    }
  }, [showLocationModal]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!formData.collegeId || !formData.password || !formData.name || !formData.collegeName || !formData.collegeEmail || !formData.phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    if (!locationTouched) {
      toast({
        title: 'Error',
        description: 'Please select your location on the map',
        variant: 'destructive',
      });
      return;
    }
    const success = await signup({
      collegeId: formData.collegeId,
      password: formData.password,
      name: formData.name,
      collegeName: formData.collegeName, // changed
      phoneNumber: formData.phoneNumber, // changed
      year: formData.year,
      course: formData.course,
      collegeEmail: formData.collegeEmail,
      location,
    });
    if (success) {
      toast({
        title: "Account Created!",
        description: "Welcome to Student Bazar",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Signup Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background image with overlay */}
      <img src="/src/assets/signup-bg.png" alt="background" className="absolute inset-0 w-full h-full object-contain object-center opacity-70 z-0" />
      <div className="absolute inset-0 bg-black/40 z-0" />
      <Card className="w-full max-w-lg shadow-medium border border-white/30 z-10 bg-white/0 backdrop-blur-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Join Student Bazar</CardTitle>
            <CardDescription>
              Create your account and start trading with fellow students
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collegeId">College ID *</Label>
              <Input
                id="collegeId"
                placeholder="Enter your College ID"
                value={formData.collegeId}
                onChange={(e) => handleInputChange('collegeId', e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collegeEmail">College Email *</Label>
                <Input
                  id="collegeEmail"
                  type="email"
                  placeholder="your-email@college.edu"
                  value={formData.collegeEmail}
                  onChange={(e) => handleInputChange('collegeEmail', e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            {/* Replace the college select with a free text input */}
            <div className="space-y-2">
              <Label htmlFor="collegeName">College Name *</Label>
              <Input
                id="collegeName"
                placeholder="Enter your College Name"
                value={formData.collegeName}
                onChange={(e) => handleInputChange('collegeName', e.target.value)}
                className="bg-background"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  placeholder="Computer Science"
                  value={formData.course}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="bg-background"
              />
            </div>
            {/* Location Picker (now as modal trigger) */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowLocationModal(true)}
              >
                {locationTouched
                  ? (location.address ? location.address : `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`)
                  : 'Click to set your location'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-background pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      {/* Location Modal */}
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
              <Marker position={[location.lat, location.lng]} icon={markerIcon} />
            </MapContainer>
          </div>
          <DialogFooter className="px-6 pb-4 pt-2">
            <div className="text-xs text-muted-foreground">
              Click on the map to set your location. Your address will appear in the form.
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;