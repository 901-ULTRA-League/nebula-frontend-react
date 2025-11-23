import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card as MuiCard,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { fetchCards } from "../api";
import type { Card } from "../types";

const STORAGE_KEY = "nebula-collection-tracker";

type OwnedState = Record<string, boolean>;
type Persisted = { version: 1; owned: OwnedState };

const cardKey = (card: Card) => String(card.id ?? card.number ?? "");

const getSetLabel = (card: Card) => {
  const displayName = card.display_card_bundle_names?.split(",")[0]?.trim();
  if (displayName && displayName !== "-") return displayName;
  const numberPrefix = card.number?.match(/^[A-Za-z]+\d+/)?.[0];
  return numberPrefix || "Unsorted";
};

const sanitizeOwned = (value: unknown): OwnedState => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as OwnedState).reduce<OwnedState>((acc, [key, val]) => {
    if (typeof val === "boolean") acc[key] = val;
    return acc;
  }, {});
};

const TrackerPage = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [owned, setOwned] = useState<OwnedState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed && typeof parsed === "object" && parsed.owned) {
        setOwned(sanitizeOwned(parsed.owned));
      }
    } catch (err) {
      console.error("Failed to read tracker state", err);
      setStorageError("Could not read saved progress. You can re-import JSON to restore.");
    }
  }, []);

  useEffect(() => {
    try {
      const payload: Persisted = { version: 1, owned };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error("Failed to persist tracker state", err);
      setStorageError("Could not save progress to this browser.");
    }
  }, [owned]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCards({});
        const sorted = [...data].sort((a, b) => (a.number || "").localeCompare(b.number || ""));
        setCards(sorted);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load cards";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Card[]>();
    cards.forEach((card) => {
      const setLabel = getSetLabel(card);
      const existing = map.get(setLabel) ?? [];
      existing.push(card);
      map.set(setLabel, existing);
    });

    return Array.from(map.entries())
      .map(([label, setCards]) => ({ label, cards: setCards }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [cards]);

  const totalCards = cards.length;
  const ownedCount = useMemo(
    () => cards.reduce((acc, card) => acc + (owned[cardKey(card)] ? 1 : 0), 0),
    [cards, owned],
  );

  const toggleCard = (card: Card) => {
    const key = cardKey(card);
    setOwned((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const setEntireGroup = (cardsInSet: Card[], value: boolean) => {
    setOwned((prev) => {
      const next = { ...prev };
      cardsInSet.forEach((card) => {
        const key = cardKey(card);
        if (value) next[key] = true;
        else delete next[key];
      });
      return next;
    });
  };

  const handleExport = () => {
    const payload: Persisted = { version: 1, owned };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nebula-collection.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<Persisted>;
      if (!parsed || typeof parsed !== "object" || !parsed.owned) {
        throw new Error("Invalid tracker file");
      }
      const sanitized = sanitizeOwned(parsed.owned);
      setOwned(sanitized);
      setStorageError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setStorageError(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleReset = () => setOwned({});

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 4 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Collection Tracker</Typography>
          <Typography color="text.secondary">
            Check off cards you own per set. Progress is saved to this browser and can be exported/imported as JSON.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImportClick}>
            Import JSON
          </Button>
          <Button variant="text" startIcon={<RestartAltIcon />} onClick={handleReset}>
            Reset
          </Button>
        </Stack>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImport}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Chip color="primary" icon={<CheckCircleIcon />} label={`Owned: ${ownedCount} / ${totalCards}`} />
        {!!storageError && <Chip color="warning" label={storageError} />} 
      </Stack>

      {grouped.map(({ label, cards: setCards }) => {
        const ownedInSet = setCards.filter((card) => owned[cardKey(card)]).length;
        return (
          <Accordion key={label} defaultExpanded disableGutters sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                <Typography variant="h6">{label}</Typography>
                <Chip label={`${ownedInSet} / ${setCards.length}`} color={ownedInSet === setCards.length ? "success" : "default"} size="small" />
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setEntireGroup(setCards, true); }}>
                    Mark all
                  </Button>
                  <Button size="small" variant="text" onClick={(e) => { e.stopPropagation(); setEntireGroup(setCards, false); }}>
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: {
                    xs: "repeat(auto-fill, minmax(260px, 1fr))",
                    sm: "repeat(auto-fill, minmax(280px, 1fr))",
                  },
                }}
              >
                {setCards.map((card) => {
                  const key = cardKey(card);
                  const checked = !!owned[key];
                  return (
                    <MuiCard key={key} variant="outlined" sx={{ display: "flex", alignItems: "stretch" }}>
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleCard(card)}
                        sx={{ alignSelf: "center", ml: 1 }}
                        inputProps={{ "aria-label": `Toggle ${card.name}` }}
                      />
                      {card.thumbnail_image_url && (
                        <Box
                          component="img"
                          src={card.thumbnail_image_url}
                          alt={card.name}
                          sx={{ width: 90, height: 120, objectFit: "cover", borderRadius: 1, ml: 1, my: 1 }}
                          loading="lazy"
                        />
                      )}
                      <CardContent sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {card.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {card.number || "No number"}
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          {card.rarity && <Chip size="small" label={card.rarity} />}
                          {card.feature && <Chip size="small" label={card.feature} />}
                          {card.type && <Chip size="small" label={card.type} />}
                        </Stack>
                      </CardContent>
                    </MuiCard>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {!grouped.length && !loading && (
        <Alert severity="info">No cards available to track.</Alert>
      )}
    </Box>
  );
};

export default TrackerPage;
