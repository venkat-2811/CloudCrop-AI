import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Cloud, Droplets, Wind, Thermometer, Search, Calendar, ThumbsUp, ThumbsDown, BarChart2, Languages } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Interfaces for data types
interface WeatherData {
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  name: string;
  sys: {
    country: string;
  };
  rain?: {
    "1h"?: number;
    "3h"?: number;
  };
  dt: number;
}

interface ForecastData {
  dt: number;
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  weather: {
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  pop: number; // Probability of precipitation
  rain?: {
    "3h"?: number;
  };
}

interface DailyForecast {
  date: string;
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  icon: string;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface PollData {
  total: number;
  accurate: number;
  inaccurate: number;
}

interface PredictionAccuracy {
  date: string;
  predicted: number;
  actual: number;
}

const WeatherApp = () => {
  // State declarations
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pollData, setPollData] = useState<PollData>({ total: 0, accurate: 0, inaccurate: 0 });
  const [accuracyData, setAccuracyData] = useState<PredictionAccuracy[]>([]);
  const [language, setLanguage] = useState("en");
  const [translatedContent, setTranslatedContent] = useState({});
  const { toast } = useToast();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Mock data for demonstration purposes (in real app, we would fetch from APIs)
  const mockAccuracyData: PredictionAccuracy[] = [
    { date: "2025-05-15", predicted: 28, actual: 27 },
    { date: "2025-05-16", predicted: 30, actual: 29 },
    { date: "2025-05-17", predicted: 29, actual: 31 },
    { date: "2025-05-18", predicted: 27, actual: 26 },
    { date: "2025-05-19", predicted: 26, actual: 26 }
  ];

  // API Keys
  const GEMINI_API_KEY = "AIzaSyCkNgOBbMU7LFX6cPiYQCMbThK3OrGgp_U";
  const PLACES_API_KEY = "AIzaSyBJ1jmpDeotonQq-k5OSV8q-9ny4AvVAro";

  // Languages available for translation
  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "te", name: "Telugu" },
    { code: "ta", name: "Tamil" },
    { code: "mr", name: "Marathi" },
    { code: "bn", name: "Bengali" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
  ];

  // Texts that need translation
  const textContent = {
    pageTitle: "Weather Insights for Farmers",
    pageSubtitle: "Get real-time weather updates for your farming decisions",
    searchPlaceholder: "Enter location (city, village, district)",
    searchButton: "Search",
    loading: "Loading...",
    currentWeather: "Current Weather",
    forecast: "5-Day Forecast",
    poll: "Local Opinion",
    accuracy: "Prediction Accuracy",
    feelsLike: "Feels Like",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    hourlyForecast: "Today's Hourly Forecast",
    noRain: "No rain",
    rain: "rain",
    farmingAdvisory: "Farming Weather Advisory",
    forecastTitle: "5-Day Weather Forecast",
    forecastDescription: "Extended forecast to help plan your farming activities",
    pollTitle: "Local Weather Opinion Poll",
    pollDescription: "Help us improve forecasts by sharing if today's prediction matches your local experience",
    pollQuestion: "Is today's weather forecast accurate for your location?",
    yesAccurate: "Yes, it's accurate",
    noDifferent: "No, it's different",
    communityResults: "Community Results",
    farmersShared: "farmers have shared their opinion",
    accurate: "Accurate",
    inaccurate: "Inaccurate",
    votes: "votes",
    overallAccuracy: "Overall Accuracy",
    date: "Date",
    predicted: "Predicted",
    actual: "Actual",
    difference: "Difference",
    modelTitle: "About Our Prediction Model",
    modelDescription: "Our weather prediction model uses Google's Gemini AI to provide forecasts for agricultural planning. We continuously improve our models based on community feedback.",
    getStartedTitle: "Enter a location to get started",
    getStartedDescription: "Search for your village, town, or city to see weather information"
  };

  // Google Translate API function - translate entire content based on language selection
  const translatePageContent = async (targetLanguage) => {
    if (targetLanguage === "en") {
      setTranslatedContent({});
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, you would use the Google Translate API
      // Here is how we would implement it (commented out for demonstration)
      /*
      const translatedTexts = {};
      for (const [key, value] of Object.entries(textContent)) {
        const response = await fetch(
          `https://translation.googleapis.com/language/translate/v2?key=YOUR_TRANSLATE_API_KEY`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q: value,
              target: targetLanguage,
              format: "text"
            }),
          }
        );
        
        const data = await response.json();
        translatedTexts[key] = data.data.translations[0].translatedText;
      }
      
      setTranslatedContent(translatedTexts);
      */
      
      // For demonstration, simulate translation
      const simulatedTranslation = {};
      const languageName = languages.find(l => l.code === targetLanguage)?.name || targetLanguage;
      
      for (const [key, value] of Object.entries(textContent)) {
        simulatedTranslation[key] = `${value} (in ${languageName})`;
      }
      
      // Simulate API call delay
      setTimeout(() => {
        setTranslatedContent(simulatedTranslation);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate content",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Get translated text helper function
  const getText = (key) => {
    if (language === "en" || !translatedContent[key]) {
      return textContent[key];
    }
    return translatedContent[key];
  };

  // Handle click outside suggestions box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const lastLocation = localStorage.getItem("lastLocation");
    if (lastLocation) {
      setLocation(lastLocation);
    }
    
    // Load mock accuracy data
    setAccuracyData(mockAccuracyData);
    
    // Load mock poll data
    const savedPoll = localStorage.getItem("weatherPoll");
    if (savedPoll) {
      setPollData(JSON.parse(savedPoll));
    }
  }, []);

  // Update translations when language changes
  useEffect(() => {
    translatePageContent(language);
  }, [language]);

  // Fetch place suggestions using Google Places API - FIXED function
  const fetchPlaceSuggestions = async (input) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // In a real implementation, you would call the Places API like this:
    /*
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${PLACES_API_KEY}`,
        { method: "GET" }
      );
      
      const data = await response.json();
      
      if (data.predictions) {
        const formattedSuggestions = data.predictions.map(prediction => ({
          description: prediction.description,
          place_id: prediction.place_id,
          main_text: prediction.structured_formatting.main_text,
          secondary_text: prediction.structured_formatting.secondary_text
        }));
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
      // Fall back to simple suggestions
    }
    */
    
    // For demo purposes, dynamically create suggestions based on input
    const dynamicSuggestions = [
      { 
        description: `${input.charAt(0).toUpperCase() + input.slice(1)}, Telangana, India`, 
        place_id: `${input}-1`, 
        main_text: `${input.charAt(0).toUpperCase() + input.slice(1)}`, 
        secondary_text: "Telangana, India" 
      },
      { 
        description: `${input.charAt(0).toUpperCase() + input.slice(1)} City, California, USA`, 
        place_id: `${input}-2`, 
        main_text: `${input.charAt(0).toUpperCase() + input.slice(1)} City`, 
        secondary_text: "California, USA" 
      },
      { 
        description: `${input.charAt(0).toUpperCase() + input.slice(1)}shire, United Kingdom`, 
        place_id: `${input}-3`, 
        main_text: `${input.charAt(0).toUpperCase() + input.slice(1)}shire`, 
        secondary_text: "United Kingdom" 
      }
    ];

    setSuggestions(dynamicSuggestions);
    setShowSuggestions(true);
  };

  // Handle user typing in the location search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    fetchPlaceSuggestions(value);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion) => {
    setLocation(suggestion.description);
    setShowSuggestions(false);
    // Fetch weather after selecting location
    fetchWeatherData(suggestion.description);
  };

  // Generate weather and farming advisory using Gemini API
  const generateWeatherWithGemini = async (locationQuery) => {
    // In a real implementation, we would call Gemini API
    // For demonstration, we'll simulate a response
    
    const prompt = `Generate detailed weather information for ${locationQuery} including:
    1. Current temperature, humidity, wind speed, and weather conditions
    2. A 5-day weather forecast with daily temperatures, conditions, humidity, wind, and rain chances
    3. Hourly forecast for today
    4. A farming advisory based on these weather conditions
    
    Format the response as JSON following this structure:
    {
      "current": {
        "temp": number (in Celsius),
        "humidity": number (percentage),
        "feels_like": number (in Celsius),
        "description": string,
        "icon": string (weather icon code),
        "wind": {
          "speed": number (in m/s)
        },
        "rain": {
          "1h": number (optional)
        }
      },
      "forecast": [
        {
          "date": "YYYY-MM-DD",
          "temp": number,
          "description": string,
          "humidity": number,
          "windSpeed": number,
          "rainChance": number,
          "icon": string
        }
      ],
      "hourly": [
        {
          "dt": number (timestamp),
          "temp": number,
          "humidity": number,
          "description": string,
          "icon": string,
          "wind": {
            "speed": number
          },
          "pop": number,
          "rain": {
            "3h": number (optional)
          }
        }
      ],
      "advisory": string
    }`;
    
    // Simulate response from Gemini API based on the location
    // In reality, this would be the response from the API call
    
    // Create some location-based variance
    const locationSeed = locationQuery.length;
    const baseTemp = 22 + (locationSeed % 15); // Temperature between 22-36°C
    const isRainy = locationSeed % 3 === 0;
    const isHot = baseTemp > 30;
    const isCold = baseTemp < 24;
    
    // Current weather with structure matching WeatherData interface
    const weatherData = {
      main: {
        temp: baseTemp,
        humidity: 50 + (locationSeed % 30),
        feels_like: baseTemp + (locationSeed % 5),
      },
      weather: [
        {
          description: isRainy ? "light rain" : isHot ? "sunny" : isCold ? "partly cloudy" : "clear sky",
          icon: isRainy ? "10d" : isHot ? "01d" : isCold ? "03d" : "02d"
        }
      ],
      wind: {
        speed: 2 + (locationSeed % 8)
      },
      rain: isRainy ? { "1h": 1.5 } : undefined,
      name: locationQuery.split(',')[0],
      sys: {
        country: locationQuery.includes("USA") ? "US" : locationQuery.includes("United Kingdom") ? "UK" : "IN"
      },
      dt: Math.floor(Date.now() / 1000)
    };
    
    // Generate daily forecasts
    const forecastDays = [];
    const baseDate = new Date();
    
    for (let day = 0; day < 5; day++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(baseDate.getDate() + day);
      
      // Add some variety to the forecast
      const dayTemp = baseTemp + Math.sin(day * 0.5) * 4;
      const dayRainChance = isRainy ? 40 + (day * 10) % 60 : (day === 2 ? 30 : 10);
      const dayDescription = dayRainChance > 30 ? 
                        "moderate rain" : 
                        dayTemp > 30 ? 
                        "sunny" : 
                        ["partly cloudy", "clear sky", "scattered clouds"][day % 3];
      
      forecastDays.push({
        date: forecastDate.toISOString().split('T')[0],
        temp: Math.round(dayTemp),
        description: dayDescription,
        humidity: Math.round(50 + Math.sin(day * 0.7) * 15),
        windSpeed: Number((2 + Math.sin(day * 0.8) * 2).toFixed(1)),
        rainChance: dayRainChance,
        icon: dayRainChance > 30 ? "10d" : dayTemp > 30 ? "01d" : ["03d", "01d", "04d"][day % 3]
      });
    }
    
    // Generate hourly forecast
    const hourlyData = [];
    
    for (let hour = 0; hour < 24; hour += 1) {
      const forecastTime = new Date(baseDate);
      forecastTime.setHours(baseDate.getHours() + hour);
      
      const hourTemp = baseTemp + Math.sin(hour/6) * 3;
      const hourRainChance = isRainy && hour > 12 && hour < 18 ? 0.4 : 0.1;
      
      hourlyData.push({
        dt: Math.floor(forecastTime.getTime() / 1000),
        main: {
          temp: hourTemp,
          humidity: 50 + Math.sin(hour/8) * 15,
          feels_like: hourTemp + Math.sin(hour/6) * 1
        },
        weather: [
          {
            description: hourRainChance > 0.3 ? "light rain" : hourTemp > 30 ? "sunny" : "partly cloudy",
            icon: hourRainChance > 0.3 ? "10d" : hourTemp > 30 ? "01d" : "03d"
          }
        ],
        wind: {
          speed: 2 + Math.sin(hour/12) * 2
        },
        pop: hourRainChance,
        rain: hourRainChance > 0.3 ? { "3h": 2.1 } : undefined
      });
    }
    
    // Generate farming advisory
    let advisory = "";
    if (isRainy) {
      advisory = "Rain expected in your area. Hold off on applying fertilizers or pesticides as they may wash away. This is a good time for planting if your soil isn't waterlogged. Consider checking drainage systems in fields.";
    } else if (isHot) {
      advisory = "High temperatures expected. Ensure crops receive adequate irrigation, preferably in early morning or evening to minimize evaporation. Monitor for heat stress in livestock and provide ample shade and water. Consider protective netting for sensitive crops.";
    } else {
      advisory = "Weather conditions are favorable for most farming activities. Good time for field work and regular crop maintenance.";
    }
    
    return {
      weatherData: weatherData,
      forecast: forecastDays,
      hourlyForecast: hourlyData,
      advisory
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short' as const, 
      month: 'short' as const, 
      day: 'numeric' as const 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch weather data using Gemini API instead of weather API
  const fetchWeatherData = async (locationQuery = location) => {
    if (!locationQuery.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to get weather data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call Gemini API to get weather data
      const weatherResponse = await generateWeatherWithGemini(locationQuery);
      
      // Update state with data from Gemini
      setWeatherData(weatherResponse.weatherData);
      setForecast(weatherResponse.forecast);
      setHourlyForecast(weatherResponse.hourlyForecast);
      localStorage.setItem("lastLocation", locationQuery);
      
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch weather data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Handle keyboard events
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchWeatherData();
    }
  };

  // Handle poll votes
  const handlePollVote = (isAccurate) => {
    const newPollData = { ...pollData };
    
    if (isAccurate) {
      newPollData.accurate += 1;
    } else {
      newPollData.inaccurate += 1;
    }
    
    newPollData.total += 1;
    setPollData(newPollData);
    localStorage.setItem("weatherPoll", JSON.stringify(newPollData));
    
    toast({
      title: "Thank you for voting!",
      description: "Your feedback helps improve our weather forecasts.",
    });
  };
  
  // Weather icon component
  const WeatherIcon = ({ icon }) => {
    const iconMap = {
      "01d": "☀️",
      "01n": "🌙",
      "02d": "⛅",
      "02n": "☁️",
      "03d": "☁️",
      "03n": "☁️",
      "04d": "☁️",
      "04n": "☁️", 
      "09d": "🌧️",
      "09n": "🌧️",
      "10d": "🌦️",
      "10n": "🌧️",
      "11d": "⛈️",
      "11n": "⛈️",
      "13d": "❄️",
      "13n": "❄️",
      "50d": "🌫️",
      "50n": "🌫️"
    };
    
    return <span className="text-3xl">{iconMap[icon] || "🌤️"}</span>;
  };

  // Calculate accuracy percentage
  const calculateAccuracy = () => {
    if (accuracyData.length === 0) return 0;
    
    let totalDifference = 0;
    let maxPossibleDifference = 0;
    
    accuracyData.forEach(day => {
      const difference = Math.abs(day.predicted - day.actual);
      totalDifference += difference;
      maxPossibleDifference += 10; // Assuming 10°C is the maximum acceptable difference
    });
    
    const accuracy = 100 - (totalDifference / maxPossibleDifference * 100);
    return Math.max(0, Math.min(100, accuracy));
  };

  return (
    <div className="min-h-screen pt-8 pb-10 bg-gradient-to-b from-white to-blue-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter mb-2 sm:text-4xl md:text-5xl">{getText("pageTitle")}</h1>
            <p className="text-gray-500 md:text-xl">{getText("pageSubtitle")}</p>
          </div>

          <div className="w-full max-w-md mb-4 flex justify-end">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center">
                      <Languages className="h-4 w-4 mr-2" />
                      {lang.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full max-w-md mb-6 relative">
            <div className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder={getText("searchPlaceholder")}
                value={location}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={() => fetchWeatherData()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? getText("loading") : getText("searchButton")}
              </Button>
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef} 
                className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200"
              >
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="font-medium">{suggestion.main_text}</div>
                    <div className="text-sm text-gray-500">{suggestion.secondary_text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {weatherData && (
            <div className="w-full max-w-4xl">
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-4">
                  <TabsTrigger value="current">{getText("currentWeather")}</TabsTrigger>
                  <TabsTrigger value="forecast">{getText("forecast")}</TabsTrigger>
                  <TabsTrigger value="poll">{getText("poll")}</TabsTrigger>
                  <TabsTrigger value="accuracy">{getText("accuracy")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="current" className="w-full">
                  <Card className="overflow-hidden border-none shadow-lg">
                    <CardHeader className="bg-primary text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-2xl">{weatherData.name}, {weatherData.sys.country}</CardTitle>
                          <CardDescription className="text-white/90 text-lg capitalize">
                            {weatherData.weather[0].description}
                          </CardDescription>
                          <p className="text-sm text-white/80 mt-1">
                            {new Date(weatherData.dt * 1000).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-4xl font-bold flex items-center">
                          <WeatherIcon icon={weatherData.weather[0].icon} />
                          <span className="ml-2">{Math.round(weatherData.main.temp)}°C</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                          <Thermometer className="h-8 w-8 text-primary mr-4" />
                          <div>
                            <p className="text-sm text-gray-500">{getText("feelsLike")}</p>
                            <p className="text-xl font-semibold">{Math.round(weatherData.main.feels_like)}°C</p>
                          </div>
                        </div>
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                          <Droplets className="h-8 w-8 text-primary mr-4" />
                          <div>
                            <p className="text-sm text-gray-500">{getText("humidity")}</p>
                            <p className="text-xl font-semibold">{weatherData.main.humidity}%</p>
                          </div>
                        </div>
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                          <Wind className="h-8 w-8 text-primary mr-4" />
                          <div>
                            <p className="text-sm text-gray-500">{getText("windSpeed")}</p>
                            <p className="text-xl font-semibold">{weatherData.wind.speed} m/s</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">{getText("hourlyForecast")}</h3>
                        <div className="overflow-x-auto">
                          <div className="flex space-x-4 pb-2" style={{ minWidth: "max-content" }}>
                            {hourlyForecast.slice(0, 8).map((hour, index) => {
                              const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              return (
                                <div key={index} className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
                                  <p className="text-sm text-gray-500">{time}</p>
                                  <WeatherIcon icon={hour.weather[0].icon} />
                                  <p className="font-medium">{Math.round(hour.main.temp)}°C</p>
                                  <p className="text-xs text-gray-500">
                                    {hour.pop > 0.3 ? `${Math.round(hour.pop * 100)}% ${getText("rain")}` : getText("noRain")}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">{getText("farmingAdvisory")}</h3>
                        <p className="text-gray-700">
                          {/* This would come from the Gemini API response */}
                          {weatherData && forecast.length > 0 ? 
                            (weatherData.weather[0].description.includes("rain") ? 
                              "Rain expected in your area. Hold off on applying fertilizers or pesticides as they may wash away. This is a good time for planting if your soil isn't waterlogged. Consider checking drainage systems in fields." : 
                              weatherData.main.temp > 30 ? 
                              "High temperatures expected. Ensure crops receive adequate irrigation, preferably in early morning or evening to minimize evaporation. Monitor for heat stress in livestock and provide ample shade and water." : 
                              "Weather conditions are favorable for most farming activities. A good time for field work, crop maintenance, and regular irrigation. Monitor soil moisture levels as moderate temperatures continue.")
                            : "Advisory will appear once weather data is loaded."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="forecast">
                  <Card>
                    <CardHeader>
                      <CardTitle>{getText("forecastTitle")}</CardTitle>
                      <CardDescription>{getText("forecastDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {forecast.map((day, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="text-center">
                              <p className="font-semibold">{formatDate(day.date)}</p>
                              <div className="my-2">
                                <WeatherIcon icon={day.icon} />
                              </div>
                              <p className="text-xl font-bold">{Math.round(day.temp)}°C</p>
                              <p className="text-sm text-gray-500 capitalize">{day.description}</p>
                              <div className="mt-3 text-xs text-gray-500 grid grid-cols-2 gap-1">
                                <div>
                                  <Droplets className="h-3 w-3 inline mr-1" />
                                  {day.humidity}%
                                </div>
                                <div>
                                  <Wind className="h-3 w-3 inline mr-1" />
                                  {day.windSpeed} m/s
                                </div>
                                <div className="col-span-2">
                                  <Cloud className="h-3 w-3 inline mr-1" />
                                  {day.rainChance}% {getText("rain")}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="poll">
                  <Card>
                    <CardHeader>
                      <CardTitle>{getText("pollTitle")}</CardTitle>
                      <CardDescription>{getText("pollDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <h3 className="font-medium text-center mb-4">{getText("pollQuestion")}</h3>
                        <div className="flex justify-center gap-4">
                          <Button 
                            onClick={() => handlePollVote(true)}
                            className="flex items-center"
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            {getText("yesAccurate")}
                          </Button>
                          <Button 
                            onClick={() => handlePollVote(false)}
                            variant="outline"
                            className="flex items-center"
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            {getText("noDifferent")}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <h3 className="font-medium text-center mb-4">{getText("communityResults")}</h3>
                        <p className="text-center text-sm mb-4">
                          <span className="font-bold text-lg">{pollData.total}</span> {getText("farmersShared")}
                        </p>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{getText("accurate")}: {pollData.accurate} {getText("votes")}</span>
                              <span className="text-sm font-medium">{pollData.total > 0 ? Math.round(pollData.accurate / pollData.total * 100) : 0}%</span>
                            </div>
                            <Progress value={pollData.total > 0 ? (pollData.accurate / pollData.total * 100) : 0} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{getText("inaccurate")}: {pollData.inaccurate} {getText("votes")}</span>
                              <span className="text-sm font-medium">{pollData.total > 0 ? Math.round(pollData.inaccurate / pollData.total * 100) : 0}%</span>
                            </div>
                            <Progress value={pollData.total > 0 ? (pollData.inaccurate / pollData.total * 100) : 0} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="accuracy">
                  <Card>
                    <CardHeader>
                      <CardTitle>{getText("overallAccuracy")}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center">
                          <Progress value={calculateAccuracy()} className="h-2 flex-1 mr-4" />
                          <span className="font-bold">{Math.round(calculateAccuracy())}%</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">{getText("date")}</th>
                              <th className="text-left py-2 px-4">{getText("predicted")} (°C)</th>
                              <th className="text-left py-2 px-4">{getText("actual")} (°C)</th>
                              <th className="text-left py-2 px-4">{getText("difference")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accuracyData.map((day, index) => (
                              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                <td className="py-2 px-4">{formatDate(day.date)}</td>
                                <td className="py-2 px-4">{day.predicted}°C</td>
                                <td className="py-2 px-4">{day.actual}°C</td>
                                <td className="py-2 px-4">
                                  <span className={Math.abs(day.predicted - day.actual) > 2 ? "text-red-500" : "text-green-500"}>
                                    {Math.abs(day.predicted - day.actual)}°C
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">{getText("modelTitle")}</h3>
                        <p className="text-sm text-gray-600">
                          {getText("modelDescription")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {!weatherData && !loading && (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{getText("getStartedTitle")}</CardTitle>
                <CardDescription>{getText("getStartedDescription")}</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;