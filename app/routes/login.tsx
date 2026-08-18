import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const signup = searchParams.get("mode") === "signup";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const googleLoginUrl = `/auth/google?${new URLSearchParams({ callbackUrl })}`;
  const googleError = searchParams.get("error");
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

          {googleError && <Alert severity="error" sx={{ mb: 3 }}>{googleError === "not_authorized" ? t("google.notAuthorized") : t("google.error")}</Alert>}
          {submitted && <Alert severity="info" sx={{ mb: 3 }}>{t("notConnected")}</Alert>}

          <Button
            component="a"
            href={googleLoginUrl}
            variant="outlined"
            color="inherit"
            size="large"
            fullWidth
            startIcon={<GoogleIcon />}
          >
            {t("google.continue")}
          </Button>

          <Divider sx={{ my: 3 }}>{t("or")}</Divider>

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
