import { Box, Typography, Grid, Paper } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useState } from "react";

const sets = {
  "Booster Packs": ["BP01", "BP02", "BP03", "BP04", "BP05"],
  "Structure Decks": ["SD01", "SD02", "SD03", "EXD01"],
  Promos: ["PR"],
};

const SetItem = ({ setCode }: { setCode: string }) => {
  const [imgSrc, setImgSrc] = useState(`/sets_images/${setCode}.webp`);
  const [error, setError] = useState(false);

  const handleError = () => {
    if (imgSrc.endsWith(".webp")) {
      setImgSrc(`/sets_images/${setCode}.png`); // Try .png
    } else {
      setError(true); // Both .webp and .png failed
    }
  };

  return (
    <Grid item xs={6} sm={4} sx={{ flexBasis: { md: '20%' }, maxWidth: { md: '20%' } }}>
      <Paper
        component={RouterLink}
        to={`/?set=${setCode}`}
        sx={{
          textDecoration: "none",
          display: "block",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: 6,
          },
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        <Box
          sx={{
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "grey.200",
            overflow: "hidden", // To prevent image overflow
          }}
        >
          {error ? (
            <Typography color="text.secondary">{setCode}</Typography>
          ) : (
            <img
              src={imgSrc}
              alt={`${setCode} Set`}
              onError={handleError}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </Box>
        <Typography sx={{ p: 1, textAlign: "center", fontWeight: "bold" }}>
          {setCode}
        </Typography>
      </Paper>
    </Grid>
  );
};

const SetsPage = () => {
  return (
    <Box>
      {Object.entries(sets).map(([category, setList]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            {category}
          </Typography>
          <Grid container spacing={3}>
            {setList.map((setCode) => (
              <SetItem key={setCode} setCode={setCode} />
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default SetsPage;
