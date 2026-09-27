import CheckIcon from "@mui/icons-material/Check";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, Link, useLocation, useRouteLoaderData } from "react-router";
import type { GoogleUser } from "~/lib/auth.server";
import type { Organization } from "~/lib/backend.server";

export type AppLayoutData = {
  user: GoogleUser;
  organizations: Organization[];
  activeOrganization: Organization | null;
  /** True when the backend could not be reached to list organizations. */
  organizationsUnavailable: boolean;
};

/** The caller's role label in an organization, falling back to admin for non-members. */
export function useRoleLabel() {
  const { t } = useTranslation("common");
  return (organization: Organization | null, user: GoogleUser | undefined) => {
    if (organization?.role) return t(`organization.roles.${organization.role}`);
    return user?.role === "ADMIN" ? t("organization.roles.ADMIN") : "";
  };
}

/** Shows the roastery being worked in and switches to another one. */
export function OrganizationSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t } = useTranslation("common");
  const location = useLocation();
  const roleLabel = useRoleLabel();
  const layout = useRouteLoaderData("routes/app-layout") as AppLayoutData | undefined;
  const organizations = layout?.organizations ?? [];
  const active = layout?.activeOrganization ?? null;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (layout?.organizationsUnavailable) return null;

  return (
    <>
      <Button
        color="inherit"
        fullWidth={fullWidth}
        endIcon={<UnfoldMoreIcon fontSize="small" />}
        aria-label={t("organization.switcherLabel")}
        aria-controls={anchor ? "organization-menu" : undefined}
        aria-expanded={anchor ? "true" : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ justifyContent: fullWidth ? "space-between" : "flex-start", textAlign: "left", py: 0.5, px: 1.25, maxWidth: fullWidth ? "none" : 240 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {active?.name ?? t("organization.noOrganization")}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {roleLabel(active, layout?.user)}
          </Typography>
        </Box>
      </Button>

      <Menu
        id="organization-menu"
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 260, maxHeight: 420 } } }}
      >
        <Form method="post" action="/organization/switch" onSubmit={() => setAnchor(null)}>
          <input type="hidden" name="returnTo" value={location.pathname} />
          {organizations.map((organization) => {
            const selected = organization.id === active?.id;
            return (
              <MenuItem
                key={organization.id}
                component="button"
                type="submit"
                name="organizationId"
                value={organization.id}
                selected={selected}
                sx={{ width: "100%" }}
              >
                <ListItemIcon>{selected && <CheckIcon fontSize="small" />}</ListItemIcon>
                <ListItemText
                  primary={organization.name}
                  secondary={roleLabel(organization, layout?.user)}
                  slotProps={{ primary: { noWrap: true } }}
                />
              </MenuItem>
            );
          })}
        </Form>
        {organizations.length > 0 && <Divider />}
        <MenuItem component={Link} to="/organization" onClick={() => setAnchor(null)}>
          <ListItemIcon><GroupOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t("organization.manage")} />
        </MenuItem>
      </Menu>
    </>
  );
}
