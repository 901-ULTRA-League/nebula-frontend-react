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
  Collapse,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { fetchCards, searchCards, fetchStats } from "../api";
import type { Card } from "../types";
import { isSemiTranscendent, isTranscendent, isNoLimit } from "../utils/cardMeta";

const rarityOptions = ["C", "U", "R", "RR", "RRR", "RRRR", "SP", "SSSP", "UR", "ExP", "AP"];
const featureOptions = ["Ultra Hero", "Kaiju", "Scene"];
const typeOptions = ["ARMED", "BASIC", "POWER", "SPEED", "DEVASTATION", "HAZARD", "METEO", "INVASION"];
const setOptions = ["BP01", "BP02", "BP03", "BP04", "BP05", "SD01", "SD02", "SD03", "EXD01", "PR"];

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
      <Stack spacing={2} sx={{ mb: 3, pt: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Search name or effect (locks other filters)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Tiga, Magnificent, Plasma Spark"
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
          <TextField
            select
            label="Set"
            value={filters.set ?? ""}
            onChange={handleFilterChange("set")}
            fullWidth
          >
            <MenuItem value="">Any</MenuItem>
            {setOptions.map((set) => (
              <MenuItem key={set} value={set}>
                {set}
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
        <TextField
          label="Card number"
          value={filters.number ?? ""}
          onChange={handleFilterChange("number")}
          fullWidth
          placeholder="e.g. BP01-001"
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
        sx={{
          aspectRatio: card.feature === "Scene" ? "unset" : "3/4",
          objectFit: card.feature === "Scene" ? "contain" : "cover",
          maxHeight: card.feature === "Scene" ? 260 : undefined,
          backgroundColor: card.feature === "Scene" ? "black" : undefined,
        }}
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
        {card.character_name && card.character_name !== "-" && <Chip size="small" label={card.character_name} />}
        {card.errata_enable && card.errata_url && (
          <Chip
            size="small"
            color="warning"
            label="Errata"
            component="a"
            href={card.errata_url}
            target="_blank"
            rel="noreferrer"
            clickable
          />
        )}
        {isTranscendent(card) && (
          <Chip
            size="small"
            color="secondary"
            label="Transcendent"
            component="a"
            href="https://ultraman-cardgame.com/page/us/news/news-detail/169"
            target="_blank"
            rel="noreferrer"
            clickable
          />
        )}
        {isSemiTranscendent(card) && (
          <Chip
            size="small"
            color="primary"
            label="Semi-Transcendent"
            component="a"
            href="https://ultraman-cardgame.com/page/us/news/news-detail/169"
            target="_blank"
            rel="noreferrer"
            clickable
          />
        )}
        {isNoLimit(card) && <Chip size="small" color="success" label="No Limit" />}
      </Stack>
    </CardContent>
    <CardActions>
      <Button component={RouterLink} to={`/card/${encodeURIComponent(card.number || String(card.id))}`} size="small">
        View details
      </Button>
    </CardActions>
  </MuiCard>
));

const CardsPage = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const setFromParams = searchParams.get("set");
    return setFromParams ? { set: setFromParams } : ({} as Record<string, string>);
  });
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await fetchStats();
        setTotalCards(stats.total_cards);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    void loadStats();
  }, []);

  const setFilter = filters.set;

  const activeFilters = useMemo(() => {
    const { set, publication_year, ...rest } = filters;
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

        if (setFilter) {
          const filteredCards = data.filter((card) => card.number?.includes(setFilter));
          setCards(filteredCards);
        } else {
          setCards(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load cards";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [appliedSearch, activeFilters, setFilter]);

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

      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={() => setFiltersVisible(!filtersVisible)}
        sx={{ mb: 1 }}
      >
        {filtersVisible ? "Hide" : "Show"} Filters
      </Button>

      <Collapse in={filtersVisible}>
        <CardFilters
          search={search}
          setSearch={setSearch}
          filters={filters}
          setFilters={setFilters}
          onSubmit={() => setAppliedSearch(search.trim())}
          onReset={handleReset}
        />
      </Collapse>

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
          <Typography variant="body1" sx={{ mb: 2, mt: 3 }}>
            {appliedSearch
              ? `Found ${cards.length} cards`
              : `Showing ${cards.length} of ${totalCards} cards`}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {cards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </Box>
          {!cards.length && <Alert sx={{ mt: 2 }} severity="info">No cards found. Try relaxing your filters.</Alert>}
        </>
      )}
    </Box>
  );
};

export default CardsPage;
