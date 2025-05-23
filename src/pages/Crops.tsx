import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Leaf, Search, AlertTriangle, Cloud } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GEMINI_API_KEY = "AIzaSyCkNgOBbMU7LFX6cPiYQCMbThK3OrGgp_U";

interface CropRecommendation {
  crop: string;
  suitability: string;
  description: string;
  marketPotential?: string;
  riskFactors?: string[];
}

interface SoilData {
  type: string;
  characteristics: string;
  suitableCrops: string[];
}

interface SoilOption {
  id: string;
  name: string;
  description: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  windSpeed: number;
  pressure: number;
  validLocation: boolean;
}

interface MarketTrend {
  crop: string;
  currentPrice: string;
  trend: string;
  demandLevel: string;
}

interface HistoricalData {
  previousYearYield: string;
  commonIssues: string[];
  successRate: string;
}

const Crops = () => {
  const [location, setLocation] = useState("");
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [availableSoilTypes, setAvailableSoilTypes] = useState<SoilOption[]>([]);
  const [selectedSoilType, setSelectedSoilType] = useState<string>("");
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [locationFound, setLocationFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const lastLocation = localStorage.getItem("lastLocationCrops");
    if (lastLocation) setLocation(lastLocation);
  }, []);

  const fetchGeminiData = async <T,>(prompt: string): Promise<T> => {
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      
      const jsonMatch = textResponse.match(/[\{\[][\s\S]*[\}\]]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textResponse);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const fetchWeatherData = async (location: string) => {
    try {
      const prompt = `Provide current weather data for ${location} as JSON with:
                    temperature (number), humidity (number), conditions (string),
                    windSpeed (number), pressure (number), validLocation (boolean).
                    If location is invalid, set validLocation: false.`;
      
      const weather = await fetchGeminiData<WeatherData>(prompt);
      
      if (!weather.validLocation) {
        throw new Error("Location not found");
      }

      setWeatherData(weather);
      return true;
    } catch (error) {
      setLocationFound(false);
      throw error;
    }
  };

  const fetchAvailableSoilTypes = async (location: string) => {
    const prompt = `List soil types for ${location} as JSON array with:
                  id (short id), name (soil type), description (key characteristics).
                  Include 5 main soil types.`;
    
    const soils = await fetchGeminiData<SoilOption[]>(prompt);
    setAvailableSoilTypes(soils);
    if (soils.length > 0) setSelectedSoilType(soils[0].id);
  };

  const fetchMarketTrends = async (location: string) => {
    const prompt = `Provide current agricultural market trends for ${location} as JSON array with:
                  crop, currentPrice, trend (Increasing/Decreasing/Stable), demandLevel (High/Medium/Low)`;
    
    const trends = await fetchGeminiData<MarketTrend[]>(prompt);
    setMarketTrends(trends);
  };

  const fetchHistoricalData = async (location: string) => {
    const prompt = `Provide agricultural historical data for ${location} as JSON with:
                  previousYearYield (%), commonIssues (array), successRate (%)`;
    
    const history = await fetchGeminiData<HistoricalData>(prompt);
    setHistoricalData(history);
  };

  // Update the fetchSoilData function with better error handling
const fetchSoilData = async (soilTypeId: string) => {
  try {
    setLoading(true);
    const soil = availableSoilTypes.find(s => s.id === soilTypeId);
    if (!soil) throw new Error("Soil type not found");

    const prompt = `Provide detailed analysis of ${soil.name} soil in ${location} as JSON with:
                  type (full soil name), 
                  characteristics (detailed description),
                  suitableCrops (array of 5-7 crop names).
                  Format: {
                    "type": "...",
                    "characteristics": "...",
                    "suitableCrops": ["crop1", "crop2"]
                  }`;
    
    const soilInfo = await fetchGeminiData<SoilData>(prompt);
    
    // Validate response structure
    if (!soilInfo.type || !soilInfo.characteristics || !Array.isArray(soilInfo.suitableCrops)) {
      throw new Error("Invalid soil data format received");
    }

    setSoilData(soilInfo);
    
    // Fetch recommendations after successful soil data load
    if (weatherData) {
      await fetchCropRecommendations(soilInfo, weatherData);
    }
  } catch (error) {
    console.error("Soil data error:", error);
    handleError(error);
    setSoilData(null);
  } finally {
    setLoading(false);
  }
};

// Update the soil analysis rendering section
{soilData && !loading && (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl">
    <Tabs defaultValue="soil">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="soil">Soil Analysis</TabsTrigger>
        <TabsTrigger value="crops">Crop Recommendations</TabsTrigger>
      </TabsList>

      <TabsContent value="soil">
        <Card>
          <CardHeader className="bg-primary text-white">
            <CardTitle>Soil Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">{soilData.type}</h3>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {soilData.characteristics}
                </p>
                <div className="mt-3">
                  <h4 className="font-medium mb-2">Suitable Crops:</h4>
                  <div className="flex flex-wrap gap-2">
                    {soilData.suitableCrops.map((crop, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="crops">
        {/* Keep existing crop recommendations UI */}
      </TabsContent>
    </Tabs>
  </motion.div>
)}

  const fetchCropRecommendations = async (soil: SoilData, weather: WeatherData) => {
    const prompt = `Generate crop recommendations for ${location} with:
                  Soil: ${soil.type} (${soil.characteristics})
                  Weather: ${weather.temperature}°C, ${weather.conditions}
                  Market Trends: ${JSON.stringify(marketTrends)}
                  Historical Data: ${JSON.stringify(historicalData)}

                  Respond in JSON array with fields:
                  crop, suitability (High/Medium/Low), description,
                  marketPotential, riskFactors (array)`;

    const recommendations = await fetchGeminiData<CropRecommendation[]>(prompt);
    setCropRecommendations(recommendations);
  };

  const fetchInitialData = async () => {
    if (!location.trim()) {
      toast({ title: "Location Required", description: "Please enter a location", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      resetState();

      const isValidLocation = await fetchWeatherData(location);
      if (!isValidLocation) return;

      await Promise.all([
        fetchAvailableSoilTypes(location),
        fetchMarketTrends(location),
        fetchHistoricalData(location)
      ]);

      setLocationFound(true);
      localStorage.setItem("lastLocationCrops", location);
    } catch (error) {
      handleError(error);
      setLocationFound(false);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSoilData(null);
    setCropRecommendations([]);
    setAvailableSoilTypes([]);
    setSelectedSoilType("");
    setMarketTrends([]);
    setHistoricalData(null);
    setError(null);
  };

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to fetch data";
    setError(message);
    toast({
      title: "Error",
      description: message.includes("Location") ? "Invalid location. Please check and try again." : message,
      variant: "destructive"
    });
  };

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'increasing': return 'bg-green-100 text-green-800';
      case 'decreasing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 bg-gradient-to-b from-white to-green-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter mb-2 sm:text-4xl md:text-5xl">Smart Farming Assistant</h1>
            <p className="text-gray-500 md:text-xl">AI-powered agricultural analysis and recommendations</p>
          </motion.div>

          <div className="w-full max-w-md mb-8">
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter location (e.g., Mumbai, Maharashtra)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && fetchInitialData()}
                className="flex-1"
              />
              <Button onClick={fetchInitialData} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Analyzing agricultural data for {location}...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center bg-red-50 text-red-800 p-4 rounded-lg mb-6 w-full max-w-4xl">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {locationFound && !loading && availableSoilTypes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mb-8">
              <Card>
                <CardHeader className="bg-primary text-white">
                  <CardTitle>Select Soil Type</CardTitle>
                  <CardDescription className="text-white/90">Identify your farm's soil characteristics</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {availableSoilTypes.map((soil) => (
                      <div key={soil.id} className="flex items-start space-x-2">
                        <input
                          type="radio"
                          id={soil.id}
                          name="soilType"
                          value={soil.id}
                          checked={selectedSoilType === soil.id}
                          onChange={() => {
                            setSelectedSoilType(soil.id);
                            fetchSoilData(soil.id);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <label htmlFor={soil.id} className="font-medium text-gray-900 block">
                            {soil.name}
                          </label>
                          <p className="text-sm text-gray-600">{soil.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {soilData && !loading && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl">
              <Tabs defaultValue="soil">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="soil">Soil Analysis</TabsTrigger>
                  <TabsTrigger value="crops">Crop Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="soil">
                  <Card>
                    <CardHeader className="bg-primary text-white">
                      <CardTitle>Soil Analysis Report</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-lg shadow">
                          <h3 className="text-xl font-semibold mb-2">{soilData.type}</h3>
                          <p className="text-gray-700 mb-4">{soilData.characteristics}</p>
                          <div className="mt-3">
                            <h4 className="font-medium mb-2">Recommended Crops:</h4>
                            <div className="flex flex-wrap gap-2">
                              {soilData.suitableCrops.map((crop, index) => (
                                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                  {crop}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="crops">
                  <Card>
                    <CardHeader className="bg-primary text-white">
                      <CardTitle>Crop Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {cropRecommendations.length > 0 ? (
                        cropRecommendations.map((rec, index) => (
                          <div key={index} className="mb-6 p-4 bg-white rounded-lg shadow">
                            <h3 className="text-xl font-semibold mb-2">{rec.crop}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Suitability:</p>
                                <span className={`${getSuitabilityColor(rec.suitability)} px-2 py-1 rounded`}>
                                  {rec.suitability}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Market Potential:</p>
                                <p className="text-gray-800">{rec.marketPotential}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Risks:</p>
                                <ul className="list-disc pl-4">
                                  {rec.riskFactors?.map((risk, i) => (
                                    <li key={i} className="text-sm text-red-600">{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <p className="mt-3 text-gray-700">{rec.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-gray-500">
                          Select a soil type to get crop recommendations
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Crops;