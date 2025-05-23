import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/pages/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VendorInfo {
  name: string;
  contact: string;
  location: string;
}

interface MarketPrice {
  id: string;
  commodity: string;
  price: number;
  unit: string;
  location: string;
  active: boolean;
  created_at: string;
  vendor_user_id: string | null;
  vendors: VendorInfo[];
}

export default function MarketPriceSearch() {
  const [commodity, setCommodity] = useState("");
  const [location, setLocation] = useState("");
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showContacts, setShowContacts] = useState<{ [key: string]: boolean }>({});

  const fetchMarketPrices = async () => {
    if (!commodity.trim() && !location.trim()) {
      setError("Please enter a commodity name or location to search");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      let query = supabase
        .from("market_prices")
        .select(`
          id,
          commodity,
          price,
          unit,
          location,
          active,
          created_at,
          vendor_user_id,
          vendors (
            name,
            contact,
            location
          )
        `)
        .order("created_at", { ascending: false });

      if (commodity.trim()) query = query.ilike("commodity", `%${commodity}%`);
      if (location.trim()) query = query.ilike("location", `%${location}%`);

      const { data, error } = await query;

      if (error) throw error;
      
      // Handle case where vendors might be null
      const typedData = data?.map(item => ({
        ...item,
        vendors: item.vendors || [],
        vendor_user_id: item.vendor_user_id || null
      })) as MarketPrice[];

      setPrices(typedData || []);
      
      if (!data?.length) {
        console.log("No prices found. Check database connection and data.");
      }

    } catch (err) {
      console.error("Fetch error details:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prices. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (priceId: string) => {
    setShowContacts(prev => ({ ...prev, [priceId]: !prev[priceId] }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Agricultural Market Prices</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4 w-full max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col gap-2 w-full max-w-md">
        <div className="flex gap-2">
          <Input
            type="text"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchMarketPrices()}
            placeholder="Search commodity (e.g., Wheat, Rice)"
            className="flex-1"
          />
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchMarketPrices()}
            placeholder="Location (District/State)"
            className="flex-1"
          />
        </div>
        <Button 
          onClick={fetchMarketPrices} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Searching..." : "Search Prices"}
        </Button>
      </div>

      <div className="mt-6 w-full max-w-2xl">
        {searchPerformed && prices.length === 0 ? (
          <p className="text-gray-500 mt-4 text-center">
            {loading ? "Searching..." : "No matching prices found. Try different search terms."}
          </p>
        ) : (
          prices.map((priceEntry) => (
            <Card key={priceEntry.id} className="mb-4">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">
                      {priceEntry.commodity.toLowerCase()}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Location: {priceEntry.location}</p>
                      {priceEntry.vendors[0]?.name && (
                        <p className="mt-1">
                          Vendor: {priceEntry.vendors[0].name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    priceEntry.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {priceEntry.active ? 'Active' : 'Closed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <p className="font-medium">Price:</p>
                    <p>{formatCurrency(priceEntry.price)}/{priceEntry.unit}</p>
                  </div>
                  <div>
                    <p className="font-medium">Updated:</p>
                    <p>{new Date(priceEntry.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {priceEntry.vendors[0] && (
                  <div className="mt-4 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleContact(priceEntry.id)}
                      className="w-full"
                    >
                      {showContacts[priceEntry.id] ? 'Hide Contact' : 'Show Contact'}
                    </Button>
                    
                    {showContacts[priceEntry.id] && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Contact: {priceEntry.vendors[0].contact || 'Not available'}</p>
                        <p>Vendor Location: {priceEntry.vendors[0].location}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}