import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Hover or focus shows the text; a tap toggles it so it also works on touch screens.
export function InfoTooltip({ title, label }: { title: string; label?: string }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Tooltip title={title} arrow open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} slotProps={{ tooltip: { sx: { maxWidth: 300 } } }}>
        <IconButton
          size="small"
          aria-label={label ?? t("moreInfo")}
          sx={{ p: 0.25, color: "text.secondary" }}
          onClick={(event) => {
            // Keep a click from reaching an enclosing <label> and toggling its control.
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </ClickAwayListener>
  );
}
