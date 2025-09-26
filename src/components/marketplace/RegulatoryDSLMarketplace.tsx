'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Star, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Users,
  Code,
  FileText,
  Shield,
  Globe,
  Calendar
} from 'lucide-react';

interface DSLBundle {
  id: string;
  name: string;
  description: string;
  version: string;
  publisher: string;
  jurisdiction: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  lastUpdated: string;
  status: 'published' | 'draft' | 'deprecated';
  signature: string;
  complianceScore: number;
  fileSize: number;
  dependencies: string[];
  changelog: string[];
  preview: string;
}

interface Regulator {
  id: string;
  name: string;
  jurisdiction: string;
  verified: boolean;
  publishedBundles: number;
  joinDate: string;
  rating: number;
}

export function RegulatoryDSLMarketplace() {
  const [bundles, setBundles] = useState<DSLBundle[]>([]);
  const [regulators, setRegulators] = useState<Regulator[]>([]);
  const [filteredBundles, setFilteredBundles] = useState<DSLBundle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedBundle, setSelectedBundle] = useState<DSLBundle | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({
    name: '',
    description: '',
    category: '',
    jurisdiction: '',
    tags: '',
    code: '',
    changelog: ''
  });

  useEffect(() => {
    fetchBundles();
    fetchRegulators();
  }, []);

  useEffect(() => {
    filterAndSortBundles();
  }, [bundles, searchQuery, selectedCategory, selectedJurisdiction, sortBy]);

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/marketplace/bundles');
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }
  };

  const fetchRegulators = async () => {
    try {
      const response = await fetch('/api/marketplace/regulators');
      if (response.ok) {
        const data = await response.json();
        setRegulators(data.regulators);
      }
    } catch (error) {
      console.error('Error fetching regulators:', error);
    }
  };

  const filterAndSortBundles = () => {
    let filtered = bundles.filter(bundle => {
      const matchesSearch = bundle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           bundle.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           bundle.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || bundle.category === selectedCategory;
      const matchesJurisdiction = selectedJurisdiction === 'all' || bundle.jurisdiction === selectedJurisdiction;
      
      return matchesSearch && matchesCategory && matchesJurisdiction;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredBundles(filtered);
  };

  const downloadBundle = async (bundleId: string) => {
    try {
      const response = await fetch(`/api/marketplace/bundles/${bundleId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bundleId}.dsl`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading bundle:', error);
    }
  };

  const publishBundle = async () => {
    try {
      const response = await fetch('/api/marketplace/bundles/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishForm),
      });

      if (response.ok) {
        await fetchBundles();
        setIsPublishing(false);
        setPublishForm({
          name: '',
          description: '',
          category: '',
          jurisdiction: '',
          tags: '',
          code: '',
          changelog: ''
        });
      }
    } catch (error) {
      console.error('Error publishing bundle:', error);
    }
  };

  const categories = ['AML', 'KYC', 'Fraud', 'Privacy', 'Data Protection', 'Risk Management', 'Compliance'];
  const jurisdictions = ['UAE', 'UK', 'EU', 'US', 'Singapore', 'Hong Kong', 'Switzerland'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regulatory DSL Marketplace</h1>
          <p className="text-muted-foreground">
            Discover, publish, and share regulatory DSL bundles directly from verified regulators
          </p>
        </div>
        <Dialog open={isPublishing} onOpenChange={setIsPublishing}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Publish Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Publish Regulatory DSL Bundle</DialogTitle>
              <DialogDescription>
                Share your regulatory DSL bundle with the community
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Bundle Name</Label>
                <Input
                  id="name"
                  value={publishForm.name}
                  onChange={(e) => setPublishForm({...publishForm, name: e.target.value})}
                  placeholder="e.g., UAE AML Regulations 2024"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({...publishForm, description: e.target.value})}
                  placeholder="Describe the regulatory requirements covered by this bundle"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={publishForm.category} onValueChange={(value) => setPublishForm({...publishForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select value={publishForm.jurisdiction} onValueChange={(value) => setPublishForm({...publishForm, jurisdiction: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction} value={jurisdiction}>{jurisdiction}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={publishForm.tags}
                  onChange={(e) => setPublishForm({...publishForm, tags: e.target.value})}
                  placeholder="e.g., CBUAE, AML, 2024, financial-institutions"
                />
              </div>
              <div>
                <Label htmlFor="code">DSL Code</Label>
                <Textarea
                  id="code"
                  value={publishForm.code}
                  onChange={(e) => setPublishForm({...publishForm, code: e.target.value})}
                  placeholder="Enter your DSL code here..."
                  className="min-h-[200px] font-mono"
                />
              </div>
              <div>
                <Label htmlFor="changelog">Changelog</Label>
                <Textarea
                  id="changelog"
                  value={publishForm.changelog}
                  onChange={(e) => setPublishForm({...publishForm, changelog: e.target.value})}
                  placeholder="Describe what's new in this version"
                />
              </div>
              <Button onClick={publishBundle} className="w-full">
                Publish Bundle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="bundles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bundles">DSL Bundles</TabsTrigger>
          <TabsTrigger value="regulators">Verified Regulators</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="bundles" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search bundles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictions.map(jurisdiction => (
                    <SelectItem key={jurisdiction} value={jurisdiction}>{jurisdiction}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles.map((bundle) => (
              <Card key={bundle.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{bundle.name}</CardTitle>
                      <CardDescription className="mt-1">{bundle.description}</CardDescription>
                    </div>
                    <Badge variant={bundle.status === 'published' ? 'default' : 'secondary'}>
                      {bundle.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{bundle.category}</Badge>
                    <Badge variant="outline">{bundle.jurisdiction}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{bundle.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{bundle.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span>{bundle.complianceScore}%</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {bundle.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {bundle.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{bundle.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {new Date(bundle.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        <span>By {bundle.publisher}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{bundle.name}</DialogTitle>
                            <DialogDescription>
                              Version {bundle.version} • {bundle.category} • {bundle.jurisdiction}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Bundle Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div>Publisher: {bundle.publisher}</div>
                                  <div>File Size: {(bundle.fileSize / 1024).toFixed(1)} KB</div>
                                  <div>Dependencies: {bundle.dependencies.length}</div>
                                  <div>Signature: {bundle.signature.substring(0, 20)}...</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Metrics</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span>Rating: {bundle.rating}/5</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Download className="w-4 h-4" />
                                    <span>Downloads: {bundle.downloads}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-4 h-4" />
                                    <span>Compliance: {bundle.complianceScore}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Preview</h4>
                              <ScrollArea className="h-[200px] w-full rounded border p-4">
                                <pre className="text-sm font-mono">{bundle.preview}</pre>
                              </ScrollArea>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Recent Changes</h4>
                              <ScrollArea className="h-[100px] w-full rounded border p-4">
                                <ul className="text-sm space-y-1">
                                  {bundle.changelog.map((change, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      <span>{change}</span>
                                    </li>
                                  ))}
                                </ul>
                              </ScrollArea>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => downloadBundle(bundle.id)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="regulators" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regulators.map((regulator) => (
              <Card key={regulator.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{regulator.name}</CardTitle>
                      <CardDescription>{regulator.jurisdiction}</CardDescription>
                    </div>
                    {regulator.verified && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{regulator.publishedBundles} bundles</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{regulator.rating}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Member since {new Date(regulator.joinDate).toLocaleDateString()}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBundles
              .sort((a, b) => b.downloads - a.downloads)
              .slice(0, 6)
              .map((bundle) => (
                <Card key={bundle.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{bundle.name}</CardTitle>
                        <CardDescription className="mt-1">{bundle.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        #{filteredBundles.indexOf(bundle) + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{bundle.category}</Badge>
                      <Badge variant="outline">{bundle.jurisdiction}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          <span>{bundle.downloads} downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{bundle.rating}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}