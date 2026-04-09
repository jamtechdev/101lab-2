import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  DollarSign, 
  Eye,
  Star,
  Shield,
  CheckCircle,
  Loader2
} from "lucide-react";
import { toastSuccess, toastError } from "@/helper/toasterNotification";

interface AuctionGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "upcoming" | "ended";
  memberCount: number;
  maxMembers: number;
  startDate: string;
  endDate: string;
  minBid: number;
  currentHighestBid: number;
  isPrivate: boolean;
  tags: string[];
  createdBy: string;
  featured: boolean;
}

const AuctionGroups = () => {
  const [groups, setGroups] = useState<AuctionGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AuctionGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data
  useEffect(() => {
    const mockGroups: AuctionGroup[] = [
      {
        id: "1",
        name: "Premium Electronics Auction",
        description: "High-end electronics including laptops, smartphones, and gaming equipment",
        category: "Electronics",
        status: "active",
        memberCount: 45,
        maxMembers: 100,
        startDate: "2024-01-15",
        endDate: "2024-01-25",
        minBid: 100,
        currentHighestBid: 2500,
        isPrivate: false,
        tags: ["electronics", "premium", "gadgets"],
        createdBy: "TechDeals Inc",
        featured: true
      },
      {
        id: "2",
        name: "Vintage Collectibles",
        description: "Rare vintage items and collectibles from the 1950s-1980s",
        category: "Collectibles",
        status: "upcoming",
        memberCount: 23,
        maxMembers: 50,
        startDate: "2024-01-20",
        endDate: "2024-01-30",
        minBid: 50,
        currentHighestBid: 0,
        isPrivate: true,
        tags: ["vintage", "rare", "collectibles"],
        createdBy: "Vintage Vault",
        featured: false
      },
      {
        id: "3",
        name: "Art & Crafts Showcase",
        description: "Beautiful handmade art pieces and craft items from local artists",
        category: "Art",
        status: "active",
        memberCount: 67,
        maxMembers: 80,
        startDate: "2024-01-10",
        endDate: "2024-01-22",
        minBid: 25,
        currentHighestBid: 450,
        isPrivate: false,
        tags: ["art", "handmade", "local"],
        createdBy: "ArtisanHub",
        featured: true
      }
    ];
    setGroups(mockGroups);
    setFilteredGroups(mockGroups);
  }, []);

  // Filter groups
  useEffect(() => {
    let filtered = groups;

    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(group => group.category === selectedCategory);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(group => group.status === selectedStatus);
    }

    setFilteredGroups(filtered);
  }, [searchTerm, selectedCategory, selectedStatus, groups]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "upcoming": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ended": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="h-3 w-3" />;
      case "upcoming": return <Calendar className="h-3 w-3" />;
      case "ended": return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleJoinGroup = (groupId: string) => {
    setLoading(true);
    setTimeout(() => {
      toastSuccess("Successfully joined the auction group!");
      setLoading(false);
    }, 1000);
  };

  const CreateGroupModal = () => {
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      category: "",
      maxMembers: "",
      startDate: "",
      endDate: "",
      minBid: "",
      isPrivate: false,
      tags: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      
      setTimeout(() => {
        toastSuccess("Auction group created successfully!");
        setShowCreateModal(false);
        setFormData({
          name: "",
          description: "",
          category: "",
          maxMembers: "",
          startDate: "",
          endDate: "",
          minBid: "",
          isPrivate: false,
          tags: ""
        });
        setLoading(false);
      }, 1500);
    };

    return (
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-5xl   max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Auction Group 
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter a catchy group name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Art">Art & Crafts</SelectItem>
                    <SelectItem value="Collectibles">Collectibles</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Home">Home & Garden</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what items will be auctioned in this group"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxMembers">Max Members</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="100"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBid">Minimum Bid ($)</Label>
                <Input
                  id="minBid"
                  type="number"
                  placeholder="25"
                  value={formData.minBid}
                  onChange={(e) => setFormData({...formData, minBid: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="electronics, premium, gadgets"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isPrivate" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Make this group private (invite only)
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Group"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Auction Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Join exciting auction groups and bid on amazing items
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search groups by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Art">Art & Crafts</SelectItem>
                  <SelectItem value="Collectibles">Collectibles</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow duration-200 relative">
            {group.featured && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{group.name}</CardTitle>
                {group.isPrivate && <Shield className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Status and Category */}
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(group.status)} variant="outline">
                  {getStatusIcon(group.status)}
                  <span className="ml-1 capitalize">{group.status}</span>
                </Badge>
                <Badge variant="secondary">{group.category}</Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{group.memberCount}/{group.maxMembers}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${group.currentHighestBid || group.minBid}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {group.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {group.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{group.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleJoinGroup(group.id)}
                  disabled={loading || group.status === "ended"}
                >
                  {group.status === "ended" ? "Ended" : "Join Group"}
                </Button>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* Created by */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Created by <span className="font-medium">{group.createdBy}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No auction groups found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to create an auction group!"}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateGroupModal />
    </div>
  );
};

export default AuctionGroups;