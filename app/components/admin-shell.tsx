import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useRouteLoaderData } from "react-router";
import type { GoogleUser } from "~/lib/auth.server";

const expandedWidth = 224;
const collapsedWidth = 60;
const drawerStorageKey = "marosa-admin-drawer-expanded";

// Inset "pill" nav item: muted when idle, green-tinted when active — matches the
// main top-nav treatment so the admin drawer feels like part of the same system.
function itemSx(expanded: boolean) {
  return {
    minHeight: 44,
    my: 0.25,
    px: 1.25,
    borderRadius: 2,
    justifyContent: expanded ? "initial" : "center",
    color: "text.secondary",
    "& .MuiListItemIcon-root": { color: "inherit" },
    "&:hover": { bgcolor: "action.hover" },
    "&.Mui-selected": {
      bgcolor: "secondary.light",
      color: "primary.main",
      "&:hover": { bgcolor: "secondary.light" },
    },
  } as const;
}

export function AdminShell({
  header,
  children,
}: {
  header?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(true);
  const appLayoutData = useRouteLoaderData("routes/app-layout") as
    | { user: GoogleUser }
    | undefined;
  const isAdmin = appLayoutData?.user.role === "ADMIN";

  useEffect(() => {
    setExpanded(window.localStorage.getItem(drawerStorageKey) !== "false");
  }, []);

  function toggleDrawer() {
    setExpanded((current) => {
      const next = !current;
      window.localStorage.setItem(drawerStorageKey, String(next));
      return next;
    });
  }

  return (
    <Box>
      {/* Full-width header band: page title / back button / machine name live here,
          so the sidebar always starts level with the content card below — regardless
          of how tall each page's heading is. Each header owns its own bottom spacing. */}
      {header}

      <Box sx={{ display: "flex", gap: isAdmin ? 3 : 0, alignItems: "start" }}>
        {isAdmin && (
          <Drawer
            component="aside"
            variant="permanent"
            open={expanded}
            sx={(theme) => ({
              width: expanded ? expandedWidth : collapsedWidth,
              flexShrink: 0,
              transition: theme.transitions.create("width", {
                duration: theme.transitions.duration.shorter,
              }),
              "& .MuiDrawer-paper": {
                position: "relative",
                zIndex: 0,
                width: expanded ? expandedWidth : collapsedWidth,
                boxSizing: "border-box",
                overflowX: "hidden",
                border: 0,
                bgcolor: "transparent",
                transition: theme.transitions.create("width", {
                  duration: theme.transitions.duration.shorter,
                }),
              },
            })}
          >
            <Box
              sx={{
                display: "flex",
                minHeight: 40,
                alignItems: "center",
                justifyContent: expanded ? "space-between" : "center",
                pl: expanded ? 1.25 : 0,
                mb: 0.5,
              }}
            >
              {expanded && (
                <Typography
                  variant="overline"
                  sx={{ color: "text.disabled", fontWeight: 700, letterSpacing: ".1em", lineHeight: 1 }}
                >
                  {t("navigation.admin")}
                </Typography>
              )}
              <Tooltip
                title={expanded ? t("admin.collapseNavigation") : t("admin.expandNavigation")}
                placement="right"
              >
                <IconButton
                  size="small"
                  onClick={toggleDrawer}
                  aria-label={expanded ? t("admin.collapseNavigation") : t("admin.expandNavigation")}
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            <List disablePadding component="nav" aria-label={t("navigation.admin")}>
              <Tooltip title={expanded ? "" : t("admin.machines")} placement="right">
                <NavLink to="/admin" prefetch="intent" style={{ color: "inherit", textDecoration: "none" }}>
                  {({ isActive }) => (
                    <ListItemButton selected={isActive} sx={itemSx(expanded)}>
                      <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 1.5 : 0, justifyContent: "center" }}>
                        <PrecisionManufacturingOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      {expanded && (
                        <ListItemText
                          primary={t("admin.machines")}
                          slotProps={{ primary: { noWrap: true, sx: { fontWeight: isActive ? 650 : 500 } } }}
                        />
                      )}
                    </ListItemButton>
                  )}
                </NavLink>
              </Tooltip>

              <Tooltip
                title={expanded ? "" : `${t("admin.analytics")} — ${t("admin.comingSoon")}`}
                placement="right"
              >
                <Box>
                  <ListItemButton disabled sx={itemSx(expanded)}>
                    <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 1.5 : 0, justifyContent: "center" }}>
                      <AnalyticsOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    {expanded && (
                      <>
                        <ListItemText
                          primary={t("admin.analytics")}
                          slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }}
                        />
                        <Chip
                          label={t("admin.comingSoon")}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      </>
                    )}
                  </ListItemButton>
                </Box>
              </Tooltip>
            </List>
          </Drawer>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
