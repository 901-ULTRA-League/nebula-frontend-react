import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { fetchStats } from "../api";
import type { Stats } from "../types";

type Distribution = Record<string, number>;

const palette = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#6366f1", "#ec4899", "#14b8a6", "#f97316"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "unknown";

const getImageStack = (label: string) => {
  const slug = slugify(label);
  const sources = [
    `/character-images/${slug}.webp`,
    `/character-images/${slug}.png`,
    `/character-images/${slug}.jpg`,
    `/character-images/${slug}.svg`,
    "/character-images/placeholder.svg",
  ];
  const layers = sources.map((url) => `url("${url}")`);
  return layers.join(", ");
};

const BarList = ({ title, data }: { title: string; data: Distribution }) => {
  const entries = useMemo(
    () =>
      Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    [data],
  );

  const maxValue = entries[0]?.[1] ?? 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Stack spacing={1}>
          {entries.map(([name, value]) => (
            <Box
              key={name}
              sx={(theme) => {
                const idx = entries.findIndex(([entryName]) => entryName === name);
                const color = palette[idx % palette.length];
                return {
                  p: 1,
                  borderRadius: 1.5,
                  background: `linear-gradient(120deg, ${color} 0%, ${theme.palette.grey[900]} 90%)`,
                  color: "white",
                  boxShadow: 2,
                };
              }}
            >
              <Box
                sx={{
                  backdropFilter: "blur(2px)",
                  backgroundColor: "rgba(15,23,42,0.55)",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="inherit" fontWeight={600} noWrap>
                    {name}
                  </Typography>
                  <Typography variant="body2" color="inherit" sx={{ ml: 1 }}>
                    {value}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    position: "relative",
                    height: 10,
                    borderRadius: 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    overflow: "hidden",
                    mt: 0.75,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: maxValue ? `${(value / maxValue) * 100}%` : "0%",
                      background: "linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.45) 100%)",
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
          {!entries.length && <Typography color="text.secondary">No data available.</Typography>}
        </Stack>
      </CardContent>
    </Card>
  );
};

type Slice = { name: string; value: number; color: string; percent: number; start: number; end: number };

const PieChart = ({ title, data }: { title: string; data: Distribution }) => {
  const slices = useMemo<Slice[]>(() => {
    const sorted = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    const total = sorted.reduce((sum, [, value]) => sum + value, 0);
    let cursor = 0;

    return sorted.map(([name, value], idx) => {
      const percent = total ? (value / total) * 100 : 0;
      const start = (cursor / total) * 360;
      cursor += value;
      const end = (cursor / total) * 360;
      return {
        name,
        value,
        percent: Math.round(percent * 10) / 10,
        color: palette[idx % palette.length],
        start: Number.isFinite(start) ? start : 0,
        end: Number.isFinite(end) ? end : 0,
      };
    });
  }, [data]);

  const gradient = slices
    .map((slice) => `${slice.color} ${slice.start}deg ${slice.end}deg`)
    .join(", ");

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {slices.length ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1.2fr" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  width: { xs: 220, sm: 240 },
                  height: { xs: 220, sm: 240 },
                  borderRadius: "50%",
                  background: `conic-gradient(${gradient})`,
                  position: "relative",
                  boxShadow: 3,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: "20%",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.94)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 2,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Entries
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {slices.reduce((sum, slice) => sum + slice.value, 0)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Stack spacing={1.2}>
              {slices.map((slice) => {
                const backgroundImages = getImageStack(slice.name);
                return (
                  <Box
                    key={slice.name}
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      backgroundImage: `${backgroundImages}, linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.9) 100%)`,
                      backgroundSize: "cover, cover",
                      backgroundPosition: "center",
                      color: "white",
                      boxShadow: 2,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: slice.color,
                          boxShadow: "0 0 0 2px rgba(255,255,255,0.4)",
                        }}
                      />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>
                          {slice.name}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {slice.value} cards — {slice.percent}%
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : (
          <Typography color="text.secondary">No data available.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ChartsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load charts";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
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

  if (!stats) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Charts &amp; Trends
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Top 10 characters by card count for Ultra Hero and Kaiju features.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
          mb: 2,
        }}
      >
        <BarList title="Top 10 Ultra Heroes" data={stats.top_25_ultras} />
        <BarList title="Top 10 Kaiju" data={stats.top_25_kaiju} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        <PieChart title="Ultra Hero Share" data={stats.top_25_ultras} />
        <PieChart title="Kaiju Share" data={stats.top_25_kaiju} />
      </Box>
    </Box>
  );
};

export default ChartsPage;
