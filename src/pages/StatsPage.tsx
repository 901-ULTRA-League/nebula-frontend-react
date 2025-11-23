import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { fetchCards, fetchStats } from "../api";
import type { Card as CardType, Stats } from "../types";

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card>
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </CardContent>
  </Card>
);

const DistributionList = ({ title, data }: { title: string; data: Record<string, number> }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={1}>
        {Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => (
            <Stack key={key} direction="row" justifyContent="space-between">
              <Typography color="text.secondary">{key}</Typography>
              <Typography>{value}</Typography>
            </Stack>
          ))}
        {!Object.keys(data).length && (
          <Typography color="text.secondary">No data available.</Typography>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const StatsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterDistribution = useMemo(() => {
    if (!cards.length) return {};
    return cards.reduce(
      (acc, card) => {
        if (card.character_name && card.character_name !== "-") {
          acc[card.character_name] = (acc[card.character_name] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [cards]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, cardsData] = await Promise.all([fetchStats(), fetchCards({})]);
        setStats(statsData);
        setCards(cardsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

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

  if (!stats) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Collection Stats
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Aggregated data from the Nebula ULTRAMAN card database.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard title="Total cards" value={stats.total_cards} />
        <StatCard title="Rarities" value={Object.keys(stats.rarity_distribution).length} />
        <StatCard title="Characters" value={Object.keys(characterDistribution).length} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <DistributionList title="By Rarity" data={stats.rarity_distribution} />
        <DistributionList title="By Feature" data={stats.feature_distribution} />
        <DistributionList title="By Character" data={characterDistribution} />
        <DistributionList
          title="By Publication Year"
          data={stats.publication_year_distribution}
        />
        <DistributionList title="Top 25 Ultras" data={stats.top_25_ultras} />
        <DistributionList title="Top 25 Kaiju" data={stats.top_25_kaiju} />
      </Box>
    </Box>
  );
};

export default StatsPage;
