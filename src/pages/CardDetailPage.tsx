import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchCardByNumber } from "../api";
import type { Card } from "../types";

const Field = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? (
    <Stack spacing={0.5}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography>{value}</Typography>
    </Stack>
  ) : null;

const CardDetailPage = () => {
  const { number = "" } = useParams();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCardByNumber(number);
        setCard(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Card not found";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadCard();
  }, [number]);

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

  if (!card) {
    return null;
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <ArrowBackIcon fontSize="small" />
        <Typography component={RouterLink} to="/" color="primary" sx={{ textDecoration: "none" }}>
          Back to cards
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
          gap: 3,
        }}
      >
        <Box>
          {card.image_url ? (
            <Box
              component="img"
              src={card.image_url}
              alt={card.name}
              sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}
            />
          ) : (
            <Paper
              variant="outlined"
              sx={{
                height: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.secondary">No image</Typography>
            </Paper>
          )}
        </Box>
        <Box>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {card.rarity && <Chip label={card.rarity} />}
              {card.feature && <Chip label={card.feature} />}
              {card.type && <Chip label={card.type} />}
            </Stack>
            <Typography variant="h4">{card.name}</Typography>
            <Typography color="text.secondary">#{card.number}</Typography>
            <Typography>{card.effect}</Typography>
            {card.flavor_text && (
              <Typography variant="body2" color="text.secondary">
                {card.flavor_text}
              </Typography>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              <Field label="Level" value={card.level} />
              <Field label="Round" value={card.round} />
              <Field label="Character" value={card.character_name} />
              <Field label="Publication year" value={card.publication_year} />
              <Field label="Illustrator" value={card.illustrator_name} />
              <Field label="Section" value={card.section} />
            </Box>

            {card.errata_enable && card.errata_url && (
              <Typography component="a" href={card.errata_url} target="_blank" rel="noreferrer">
                View errata
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
};

export default CardDetailPage;
