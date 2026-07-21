import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} sx={{ mb: 3.5, justifyContent: "space-between", alignItems: { sm: "flex-end" }, gap: 2 }}>
      <Box>
        <Typography component="h1" variant="h4">{title}</Typography>
        {description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 650 }}>{description}</Typography>}
      </Box>
      {actions && <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{actions}</Stack>}
    </Stack>
  );
}
