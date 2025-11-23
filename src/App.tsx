import { AppBar, Box, Button, Container, Stack, Toolbar, Typography, CircularProgress } from "@mui/material";
import { Link as RouterLink, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import "./App.css";

const CardsPage = lazy(() => import("./pages/CardsPage"));
const CardDetailPage = lazy(() => import("./pages/CardDetailPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const SetsPage = lazy(() => import("./pages/SetsPage"));
const ChartsPage = lazy(() => import("./pages/ChartsPage"));

const App = () => (
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
        <Stack direction="row" spacing={1}>
          <Button color="inherit" component={RouterLink} to="/">
            Cards
          </Button>
          <Button color="inherit" component={RouterLink} to="/sets">
            Sets
          </Button>
          <Button color="inherit" component={RouterLink} to="/stats">
            Stats
          </Button>
          <Button color="inherit" component={RouterLink} to="/charts">
            Charts
          </Button>
        </Stack>
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
        © 2025 901 ULTRA League. All rights reserved.
      </Box>
    </Container>
  </Box>
);

export default App;
