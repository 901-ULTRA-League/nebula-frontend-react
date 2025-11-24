import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  CircularProgress,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link as RouterLink, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import "./App.css";

const CardsPage = lazy(() => import("./pages/CardsPage"));
const CardDetailPage = lazy(() => import("./pages/CardDetailPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const SetsPage = lazy(() => import("./pages/SetsPage"));
const ChartsPage = lazy(() => import("./pages/ChartsPage"));
const TrackerPage = lazy(() => import("./pages/TrackerPage"));

const navLinks = [
  { to: "/", label: "Cards" },
  { to: "/tracker", label: "Tracker" },
  { to: "/sets", label: "Sets" },
  { to: "/stats", label: "Stats" },
  { to: "/charts", label: "Charts" },
];

const App = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f172a 0%, #0b1020 60%, #0f172a 100%)" }}>
      <AppBar position="fixed" color="transparent" elevation={0} sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Toolbar>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ flexGrow: 1, color: "white", textDecoration: "none", fontWeight: 700, letterSpacing: 0.5 }}
          >
            Nebula Collection
          </Typography>
          {isDesktop ? (
            <Stack direction="row" spacing={1}>
              {navLinks.map((link) => (
                <Button key={link.to} color="inherit" component={RouterLink} to={link.to}>
                  {link.label}
                </Button>
              ))}
            </Stack>
          ) : (
            <>
              <IconButton color="inherit" edge="end" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 240, p: 1 }}>
                  <List>
                    {navLinks.map((link) => (
                      <ListItemButton
                        key={link.to}
                        component={RouterLink}
                        to={link.to}
                        onClick={() => setDrawerOpen(false)}
                      >
                        <ListItemText primary={link.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container sx={{ pt: 12, pb: 6 }}>
        <Suspense
          fallback={
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          }
        >
          <Routes>
            <Route path="/" element={<CardsPage />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/sets" element={<SetsPage />} />
            <Route path="/card/:number" element={<CardDetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/charts" element={<ChartsPage />} />
          </Routes>
        </Suspense>
        <Box
          component="footer"
          sx={{ pt: 4, textAlign: "center", color: "rgba(255,255,255,0.72)", fontSize: 14, letterSpacing: 0.3 }}
        >
          c 2025 901 ULTRA League. All rights reserved.
        </Box>
      </Container>
    </Box>
  );
};

export default App;
