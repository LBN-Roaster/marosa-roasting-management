import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { PageHeading } from "~/components/page-heading";

export function TbuPage({ titleKey }: { titleKey: "home" | "cupping" | "settings" }) {
  const { t } = useTranslation("common");
  return (
    <>
      <PageHeading title={t(`pages.${titleKey}`)} />
      <Card sx={{ borderStyle: "dashed" }}>
        <CardContent>
          <Stack sx={{ minHeight: 280, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <Avatar sx={{ mb: 2, bgcolor: "action.hover", color: "text.secondary" }}><ConstructionOutlinedIcon /></Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("tbu.title")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t("tbu.description")}</Typography>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
