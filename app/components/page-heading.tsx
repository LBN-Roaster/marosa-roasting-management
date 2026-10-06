import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { InfoTooltip } from "~/components/info-tooltip";
import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} sx={{ mb: 3.5, justifyContent: "space-between", alignItems: { sm: "flex-end" }, gap: 2 }}>
      <Box>
        {eyebrow && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{eyebrow}</Typography>}
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
          <Typography component="h1" variant="h4">{title}</Typography>
          {description && <InfoTooltip title={description} />}
        </Stack>
      </Box>
      {actions && <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{actions}</Stack>}
    </Stack>
  );
}
