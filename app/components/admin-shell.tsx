import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useRouteLoaderData } from "react-router";
import type { GoogleUser } from "~/lib/auth.server";

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation("common");
  const appLayoutData = useRouteLoaderData("routes/app-layout") as
    | { user: GoogleUser }
    | undefined;
  const isAdmin = appLayoutData?.user.role === "ADMIN";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: isAdmin
          ? { xs: "1fr", md: "220px minmax(0, 1fr)" }
          : "1fr",
        gap: { xs: 2, md: 4 },
        alignItems: "start",
      }}
    >
      {isAdmin && (
        <Paper component="aside" variant="outlined" sx={{ overflow: "hidden" }}>
          <List disablePadding component="nav" aria-label={t("navigation.admin")}>
            <NavLink to="/admin" prefetch="intent" style={{ color: "inherit", textDecoration: "none" }}>
              {({ isActive }) => (
                <ListItemButton selected={isActive} sx={{ py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    <PrecisionManufacturingOutlinedIcon color={isActive ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <ListItemText primary={t("admin.machines")} />
                </ListItemButton>
              )}
            </NavLink>
            <ListItemButton disabled sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 38 }}>
                <AnalyticsOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary={t("admin.analytics")}
                secondary={t("admin.comingSoon")}
                slotProps={{
                  primary: { noWrap: true },
                  secondary: { noWrap: true, variant: "caption" },
                }}
              />
            </ListItemButton>
          </List>
        </Paper>
      )}
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
