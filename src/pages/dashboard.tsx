import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, 
  Paper, Snackbar, Alert, Box, InputAdornment, Switch, FormControlLabel, Grid, MenuItem } from '@mui/material';
import { supabase } from '@/pages/supabase';

interface MarketPrice {
  id: string;
  created_at: string;
  updated_at: string;
  vendor_id: string;
  commodity: string;
  price: number;
  unit: string;
  location: string;
  active: boolean;
}

interface User {
  id: string;
  email?: string;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const AgricultureVendorDashboard: React.FC = () => {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [commodity, setCommodity] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [unit, setUnit] = useState('kg');
  const [location, setLocation] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setIsAuthLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session) return;

        setUser({ id: session.user.id, email: session.user.email });
        fetchMarketPrices(session.user.id);
      } catch (error) {
        console.error('Error checking auth session:', error);
        showAlert('Authentication error. Please try logging in again.', 'error');
      } finally {
        setIsAuthLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser({ id: session.user.id, email: session.user.email });
        fetchMarketPrices(session.user.id);
      } else {
        setUser(null);
        setMarketPrices([]);
        setLoading(false);
      }
    });

    checkUserSession();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchMarketPrices = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by commodity and get latest entry
      const groupedData = data.reduce((acc, curr) => {
        if (!acc[curr.commodity]) {
          acc[curr.commodity] = curr;
        }
        return acc;
      }, {} as Record<string, MarketPrice>);

      setMarketPrices(Object.values(groupedData));
    } catch (error) {
      console.error('Error fetching market prices:', error);
      showAlert('Failed to load market prices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async () => {
    if (!user) {
      showAlert('Please sign in to add prices', 'warning');
      return;
    }

    if (!commodity || !price) {
      showAlert('Please fill in required fields (Commodity and Price)', 'warning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('market_prices')
        .insert([{
          commodity,
          price: Number(price),
          unit,
          location,
          active,
          vendor_id: user.id
        }])
        .select();

      if (error) throw error;
      
      setMarketPrices([data[0], ...marketPrices]);
      clearForm();
      showAlert('Price entry added successfully!', 'success');
    } catch (error) {
      console.error('Error adding price:', error);
      showAlert('Failed to add price entry', 'error');
    }
  };

  const handleDeleteCommodity = async (commodityName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('market_prices')
        .delete()
        .eq('vendor_id', user.id)
        .eq('commodity', commodityName);

      if (error) throw error;

      setMarketPrices(marketPrices.filter(mp => mp.commodity !== commodityName));
      showAlert('Commodity deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting commodity:', error);
      showAlert('Failed to delete commodity', 'error');
    }
  };

  const clearForm = () => {
    setCommodity('');
    setPrice('');
    setUnit('kg');
    setLocation('');
    setActive(true);
  };

  const showAlert = (message: string, severity: AlertState['severity']) => {
    setAlert({ open: true, message, severity });
  };

  const handleAlertClose = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" align="center" gutterBottom>
          Commodity Prices Dashboard
        </Typography>
        
        {user ? (
          <>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Add New Price Entry
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Commodity Name"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    select
                    label="Unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="kg">kg</MenuItem>
                    <MenuItem value="g">g</MenuItem>
                    <MenuItem value="ton">Ton</MenuItem>
                    <MenuItem value="quintal">Quintal</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={9}>
                  <TextField
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
                    label="Active Listing"
                  />
                </Grid>
              </Grid>
              
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button variant="contained" onClick={handleAddPrice}>
                  Add Price Entry
                </Button>
              </Box>
            </Paper>

            <Paper>
              <Typography variant="h5" p={2} gutterBottom>
                Your Price Listings
              </Typography>
              {loading ? (
                <Box p={3} textAlign="center">
                  <Typography>Loading prices...</Typography>
                </Box>
              ) : marketPrices.length === 0 ? (
                <Box p={3} textAlign="center">
                  <Typography>No price entries available</Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Commodity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketPrices.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.commodity}</TableCell>
                        <TableCell>
                          ₹{entry.price} / {entry.unit}
                        </TableCell>
                        <TableCell>{entry.unit}</TableCell>
                        <TableCell>{entry.location}</TableCell>
                        <TableCell>
                          <Switch checked={entry.active} disabled />
                        </TableCell>
                        <TableCell>
                          <Button
                            color="error"
                            onClick={() => handleDeleteCommodity(entry.commodity)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </>
        ) : (
          <Box textAlign="center" p={3}>
            <Typography variant="h6">Please sign in to access the dashboard</Typography>
          </Box>
        )}

        <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleAlertClose}>
          <Alert severity={alert.severity} onClose={handleAlertClose}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default AgricultureVendorDashboard;
