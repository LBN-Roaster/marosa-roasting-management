import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import Chip from "@mui/material/Chip";
import { useTranslation } from "react-i18next";
import type { RoasterStatus } from "~/lib/backend.server";

// Status always pairs an icon with its label, so it never rests on color alone.
const appearance: Record<RoasterStatus, { color: "success" | "default" | "warning"; icon: typeof CloudOffOutlinedIcon }> = {
  ACTIVE: { color: "success", icon: LocalFireDepartmentIcon },
  IDLE: { color: "default", icon: PauseCircleOutlineIcon },
  OFFLINE: { color: "warning", icon: CloudOffOutlinedIcon },
  NO_CONTROLLER: { color: "default", icon: LinkOffOutlinedIcon },
};

export function RoasterStatusChip({ status, size = "small" }: { status: RoasterStatus; size?: "small" | "medium" }) {
  const { t } = useTranslation("common");
  const { color, icon: Icon } = appearance[status];
  return (
    <Chip
      size={size}
      color={color}
      variant={status === "ACTIVE" ? "filled" : "outlined"}
      icon={<Icon />}
      label={t(`roasters.status.${status}`)}
    />
  );
}

export function UploadProblemChip({ size = "small" }: { size?: "small" | "medium" }) {
  const { t } = useTranslation("common");
  return <Chip size={size} color="error" variant="outlined" icon={<ErrorOutlineIcon />} label={t("roasters.uploadProblem")} />;
}
