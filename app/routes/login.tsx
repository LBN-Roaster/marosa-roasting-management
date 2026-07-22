import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinkMui from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { PublicHeader } from "~/components/public-header";

export function meta() {
  return [{ title: "Sign in | MAROSA" }];
}

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const signup = searchParams.get("mode") === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setSubmitted(true);
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FBFCFA", backgroundImage: "radial-gradient(circle at 50% 0%, rgba(90,175,135,.16), transparent 30rem)" }}>
      <PublicHeader compact />
      <Container component="main" maxWidth="sm" sx={{ py: { xs: 5, sm: 8 } }}>
        <Button component={Link} to="/" color="inherit" startIcon={<ArrowBackIcon />} sx={{ mb: 3, ml: -1 }}>{t("back")}</Button>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, boxShadow: "0 24px 70px rgba(26,58,52,.09)" }}>
          <Typography component="h1" variant="h4">{signup ? t("signup.title") : t("login.title")}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>{signup ? t("signup.subtitle") : t("login.subtitle")}</Typography>

          {submitted && <Alert severity="info" sx={{ mb: 3 }}>{t("notConnected")}</Alert>}

          <Stack component="form" spacing={2.5} onSubmit={submit} noValidate={false}>
            {signup && <TextField name="name" label={t("name")} autoComplete="name" required fullWidth />}
            <TextField name="email" type="email" label={t("email")} autoComplete="email" required fullWidth autoFocus />
            <TextField
              name="password"
              type={showPassword ? "text" : "password"}
              label={t("password")}
              autoComplete={signup ? "new-password" : "current-password"}
              required
              fullWidth
              slotProps={{
                htmlInput: { minLength: signup ? 8 : 1 },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("hidePassword") : t("showPassword")}>
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {!signup && (
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <FormControlLabel control={<Checkbox size="small" />} label={<Typography variant="body2">{t("remember")}</Typography>} />
                <LinkMui component="button" type="button" underline="hover" variant="body2">{t("forgot")}</LinkMui>
              </Stack>
            )}

            <Button type="submit" variant="contained" size="large" fullWidth>{signup ? t("signup.submit") : t("login.submit")}</Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            {signup ? t("signup.haveAccount") : t("login.noAccount")}{" "}
            <LinkMui component={Link} to={signup ? "/login" : "/login?mode=signup"} underline="hover" sx={{ fontWeight: 700 }}>
              {signup ? t("login.submit") : t("signup.submit")}
            </LinkMui>
          </Typography>
        </Paper>
        <Typography variant="caption" color="text.secondary" align="center" component="p" sx={{ mt: 3 }}>{t("security")}</Typography>
      </Container>
    </Box>
  );
}
