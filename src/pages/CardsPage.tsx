import { memo, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card as MuiCard,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { fetchCards, searchCards } from "../api";
import type { Card } from "../types";

const rarityOptions = ["C", "U", "R", "RR", "RRR", "RRRR", "SP", "SSSP", "UR", "ExP", "AP"];
const featureOptions = ["Ultra", "Kaiju", "Scene"];
const typeOptions = ["ARMED", "BASIC", "POWER", "SPEED", "DEVASTATION", "HAZARD", "METEO", "INVASION"];

const CardFilters = memo(
  ({
    search,
    setSearch,
    filters,
    setFilters,
    onSubmit,
    onReset,
  }: {
    search: string;
    setSearch: (value: string) => void;
    filters: Record<string, string>;
    setFilters: (next: Record<string, string>) => void;
    onSubmit: () => void;
    onReset: () => void;
  }) => {
    const handleFilterChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, [key]: event.target.value });
    };

    return (
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Search name or effect"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. TIGA, attack, BP01-001"
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onSubmit}>
              Search
            </Button>
            <Button variant="outlined" onClick={onReset}>
              Clear
            </Button>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            label="Rarity"
            value={filters.rarity ?? ""}
            onChange={handleFilterChange("rarity")}
            fullWidth
          >
            <MenuItem value="">Any</MenuItem>
            {rarityOptions.map((rarity) => (
              <MenuItem key={rarity} value={rarity}>
                {rarity}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Feature"
            value={filters.feature ?? ""}
            onChange={handleFilterChange("feature")}
            fullWidth
          >
            <MenuItem value="">Any</MenuItem>
            {featureOptions.map((feature) => (
              <MenuItem key={feature} value={feature}>
                {feature}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type"
            value={filters.type ?? ""}
            onChange={handleFilterChange("type")}
            fullWidth
          >
            <MenuItem value="">Any</MenuItem>
            {typeOptions.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Level"
            value={filters.level ?? ""}
            onChange={handleFilterChange("level")}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="Round"
            value={filters.round ?? ""}
            onChange={handleFilterChange("round")}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="Publication year"
            value={filters.publication_year ?? ""}
            onChange={handleFilterChange("publication_year")}
            fullWidth
            inputMode="numeric"
          />
        </Stack>
        <TextField
          label="Character name"
          value={filters.character_name ?? ""}
          onChange={handleFilterChange("character_name")}
          fullWidth
          placeholder="TIGA, BELIAL, etc."
        />
      </Stack>
    );
  },
);

const CardTile = memo(({ card }: { card: Card }) => (
  <MuiCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    {card.thumbnail_image_url ? (
      <CardMedia
        component="img"
        image={card.thumbnail_image_url}
        alt={card.name}
        sx={{ aspectRatio: "3/4", objectFit: "cover" }}
        loading="lazy"
      />
    ) : (
      <Box
        sx={{
          height: 200,
          background: (theme) => theme.palette.grey[200],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">No image</Typography>
      </Box>
    )}
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {card.number || "Unknown number"}
      </Typography>
      <Typography variant="h6" gutterBottom>
        {card.name}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {card.rarity && <Chip size="small" label={card.rarity} />}
        {card.feature && <Chip size="small" label={card.feature} />}
        {card.type && <Chip size="small" label={card.type} />}
      </Stack>
    </CardContent>
    <CardActions>
      <Button component={RouterLink} to={`/card/${card.number || card.id}`} size="small">
        View details
      </Button>
    </CardActions>
  </MuiCard>
));

const CardsPage = () => {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFilters = useMemo(() => {
    const { publication_year, ...rest } = filters;
    return {
      ...rest,
      publication_year: publication_year ? Number(publication_year) : undefined,
    };
  }, [filters]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = appliedSearch
          ? await searchCards(appliedSearch)
          : await fetchCards(activeFilters);
        setCards(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load cards";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [appliedSearch, activeFilters]);

  const handleReset = () => {
    setSearch("");
    setAppliedSearch("");
    setFilters({});
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ULTRAMAN Cards
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Browse cards from the Nebula API. Use search to look through names, effects, and flavor text,
        or filter by rarity, feature, and other metadata.
      </Typography>

      <CardFilters
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
        onSubmit={() => setAppliedSearch(search.trim())}
        onReset={handleReset}
      />

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {cards.map((card) => (
              <CardTile key={`${card.id}-${card.number}`} card={card} />
            ))}
          </Box>
          {!cards.length && <Alert sx={{ mt: 2 }} severity="info">No cards found. Try relaxing your filters.</Alert>}
        </>
      )}
    </Box>
  );
};

export default CardsPage;
