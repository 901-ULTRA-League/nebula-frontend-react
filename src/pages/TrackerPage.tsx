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
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { fetchCards } from "../api";
import type { Card } from "../types";
import { isSemiTranscendent, isTranscendent, isNoLimit } from "../utils/cardMeta";

const STORAGE_KEY = "nebula-collection-tracker";

type OwnedState = Record<string, number>;
type Persisted = { version: 2; owned: OwnedState };

const cardKey = (card: Card) => (card.number ? card.number.toUpperCase() : String(card.id ?? ""));
const legacyIdKey = (card: Card) => (card.id !== undefined ? String(card.id) : undefined);
const normalizeNumber = (card: Card) => card.number?.toUpperCase();

const getSetLabel = (card: Card) => {
  const displayName = card.display_card_bundle_names?.split(",")[0]?.trim();
  if (displayName && displayName !== "-") return displayName;
  const numberPrefix = card.number?.match(/^[A-Za-z]+\d+/)?.[0];
  return numberPrefix || "Unsorted";
};

const getMaxForCard = (card: Card) => {
  const num = normalizeNumber(card);
  if (num === "PR-036") return 50;
  if (num === "PR-107") return 8;
  return 4;
};

const sanitizeOwned = (value: unknown): OwnedState => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<OwnedState>((acc, [key, val]) => {
    const normalizedKey = String(key).toUpperCase();
    if (typeof val === "number" && Number.isFinite(val)) {
      acc[normalizedKey] = Math.max(0, Math.floor(val));
    } else if (val === true) {
      acc[normalizedKey] = 1; // legacy boolean
    }
    return acc;
  }, {});
};

const clampOwnedToCards = (owned: OwnedState, cards: Card[]) => {
  const next: OwnedState = {};
  cards.forEach((card) => {
    const key = cardKey(card);
    const legacyKey = legacyIdKey(card);
    const count =
      owned[key] ??
      owned[key.toUpperCase()] ??
      (legacyKey ? owned[legacyKey] ?? owned[legacyKey.toUpperCase()] : 0) ??
      0;
    const max = getMaxForCard(card);
    const clamped = Math.min(Math.max(0, count), max);
    if (clamped > 0) next[key] = clamped;
  });
  return next;
};

const TrackerPage = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [owned, setOwned] = useState<OwnedState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasHydrated = useRef(false);
  const skippedInitialPersist = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted | { owned?: unknown };
        if (parsed && typeof parsed === "object" && parsed.owned) {
          setOwned(sanitizeOwned(parsed.owned));
        }
      }
    } catch (err) {
      console.error("Failed to read tracker state", err);
      setStorageError("Could not read saved progress. You can re-import JSON to restore.");
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    if (!skippedInitialPersist.current) {
      skippedInitialPersist.current = true;
      return; // avoid overwriting saved data before hydration syncs
    }
    try {
      const payload: Persisted = { version: 2, owned };
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
        setOwned((prev) => clampOwnedToCards(prev, sorted));
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
  const totalCopiesPossible = useMemo(() => cards.reduce((acc, card) => acc + getMaxForCard(card), 0), [cards]);
  const ownedCopies = useMemo(() => cards.reduce((acc, card) => acc + (owned[cardKey(card)] ?? 0), 0), [cards, owned]);
  const ownedUniques = useMemo(() => Object.values(owned).filter((count) => count > 0).length, [owned]);

  const setCardCount = (card: Card, nextCount: number) => {
    const key = cardKey(card);
    const max = getMaxForCard(card);
    const clamped = Math.max(0, Math.min(max, Math.floor(nextCount)));
    setOwned((prev) => {
      if (clamped <= 0) {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: clamped };
    });
  };

  const adjustCard = (card: Card, delta: number) => {
    const current = owned[cardKey(card)] ?? 0;
    setCardCount(card, current + delta);
  };

  const setEntireGroup = (cardsInSet: Card[], toMax: boolean) => {
    setOwned((prev) => {
      const next = { ...prev };
      cardsInSet.forEach((card) => {
        const key = cardKey(card);
        if (toMax) {
          next[key] = getMaxForCard(card);
        } else {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleExport = () => {
    const payload: Persisted = { version: 2, owned };
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
      setOwned(cards.length ? clampOwnedToCards(sanitized, cards) : sanitized);
      setStorageError(null);
      hasHydrated.current = true;
      skippedInitialPersist.current = true; // ensure next persist writes
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setStorageError(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleExportImage = async () => {
    if (!grouped.length) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 16;
    const lineHeight = 24;
    const headerHeight = 30;
    const gapBetweenSets = 8;

    ctx.font = "16px 'Segoe UI', sans-serif";
    const lines: { text: string; isHeader: boolean }[] = [];

    grouped.forEach(({ label, cards: setCards }) => {
      const setOwnedCopies = setCards.reduce((acc, card) => acc + (owned[cardKey(card)] ?? 0), 0);
      const setMaxCopies = setCards.reduce((acc, card) => acc + getMaxForCard(card), 0);
      lines.push({ text: `${label} (${setOwnedCopies}/${setMaxCopies})`, isHeader: true });
      setCards.forEach((card) => {
        const max = getMaxForCard(card);
        const count = owned[cardKey(card)] ?? 0;
        const status = count > 0 ? "✓" : "x";
        const number = card.number || "No number";
        lines.push({ text: `${status} ${count}/${max} ${number} - ${card.name}`, isHeader: false });
      });
      lines.push({ text: "", isHeader: false }); // spacer
    });

    const maxWidth = lines.reduce((max, line) => Math.max(max, ctx.measureText(line.text).width), 0);
    canvas.width = Math.min(2000, Math.max(720, Math.ceil(maxWidth + padding * 2)));
    canvas.height =
      padding * 2 +
      lines.reduce((acc, line) => acc + (line.isHeader ? headerHeight : lineHeight), 0) +
      grouped.length * gapBetweenSets;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = padding + lineHeight;
    lines.forEach((line) => {
      if (line.isHeader) {
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#5ac8fa";
        ctx.fillText(line.text, padding, y);
        y += headerHeight;
        ctx.font = "16px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#e5e7eb";
      } else {
        ctx.fillStyle = line.text.startsWith("✓") ? "#22c55e" : "#ef4444";
        ctx.fillText(line.text, padding, y);
        y += lineHeight;
      }
      if (line.text === "") {
        y += gapBetweenSets;
      }
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nebula-collection.png";
      a.click();
      URL.revokeObjectURL(url);
    });
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4">Collection Tracker</Typography>
          <Typography color="text.secondary">
            Track counts per card (default max 4, PR-036 up to 50, PR-107 up to 8). Progress is saved in this browser.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImportClick}>
            Import JSON
          </Button>
          <Button variant="outlined" startIcon={<ImageIcon />} onClick={handleExportImage}>
            Export checklist image
          </Button>
          <Button variant="text" startIcon={<RestartAltIcon />} onClick={handleReset}>
            Reset
          </Button>
        </Stack>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Chip color="primary" icon={<CheckCircleIcon />} label={`Owned copies: ${ownedCopies} / ${totalCopiesPossible}`} />
        <Chip color="secondary" label={`Unique owned: ${ownedUniques} / ${totalCards}`} />
        {!!storageError && <Chip color="warning" label={storageError} />}
      </Stack>

      {grouped.map(({ label, cards: setCards }) => {
        const ownedInSet = setCards.reduce((acc, card) => acc + (owned[cardKey(card)] ?? 0), 0);
        const maxInSet = setCards.reduce((acc, card) => acc + getMaxForCard(card), 0);
        const uniqueOwnedInSet = setCards.filter((card) => (owned[cardKey(card)] ?? 0) > 0).length;
        return (
          <Accordion key={label} defaultExpanded disableGutters sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                <Typography variant="h6">{label}</Typography>
                <Chip
                  label={`${ownedInSet} / ${maxInSet} copies`}
                  color={ownedInSet === maxInSet ? "success" : "default"}
                  size="small"
                />
                <Chip label={`${uniqueOwnedInSet} / ${setCards.length} unique`} size="small" />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setEntireGroup(setCards, true);
                  }}
                >
                  Max all
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setEntireGroup(setCards, false);
                  }}
                >
                  Clear
                </Button>
              </Stack>
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
                  const count = owned[key] ?? 0;
                  const max = getMaxForCard(card);
                  return (
                    <MuiCard key={key} variant="outlined" sx={{ display: "flex", alignItems: "stretch" }}>
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
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => adjustCard(card, -1)}
                            aria-label={`Decrease ${card.name}`}
                            disabled={count <= 0}
                          >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 64 }} variant="body2">
                            {count} / {max}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => adjustCard(card, 1)}
                            aria-label={`Increase ${card.name}`}
                            disabled={count >= max}
                          >
                            <AddCircleOutlineIcon fontSize="small" />
                          </IconButton>
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

      {!grouped.length && !loading && <Alert severity="info">No cards available to track.</Alert>}
    </Box>
  );
};

export default TrackerPage;



