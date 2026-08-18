import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Await, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { AdminShell } from "~/components/admin-shell";
import { PageHeading } from "~/components/page-heading";
import {
  getAdminMachines,
  type AdminMachine,
  type MachineStatus,
  type PageResponse,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-machines";

const statuses: MachineStatus[] = [
  "IN_PRODUCTION",
  "READY_FOR_SHIPPING",
  "SOLD",
  "CONSIGNMENT",
];

export function meta() {
  return [{ title: "Admin · Machines | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Page/size come from the URL so pagination is server-driven and shareable.
  // Return the promise (do NOT await) so the shell streams behind a skeleton.
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
  return { machines: getAdminMachines(request, { page, size }) };
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MachinesTableSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} height={44} />
      ))}
    </Box>
  );
}

function MachinesTable({
  page,
  search,
  status,
  onOpen,
}: {
  page: PageResponse<AdminMachine>;
  search: string;
  status: MachineStatus | "all";
  onOpen: (machineId: string) => void;
}) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";
  const [, setSearchParams] = useSearchParams();

  // Client-side search/status filters only the current page of results.
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return page.content.filter((machine) => {
      const matchesSearch =
        !query ||
        machine.serialNumber.toLocaleLowerCase().includes(query) ||
        machine.name?.toLocaleLowerCase().includes(query);
      return matchesSearch && (status === "all" || machine.status === status);
    });
  }, [page.content, search, status]);

  function changePage(next: number) {
    setSearchParams(
      (prev) => {
        prev.set("page", String(next));
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  function changeSize(size: number) {
    setSearchParams(
      (prev) => {
        prev.set("size", String(size));
        prev.set("page", "0");
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  return (
    <>
      <TableContainer>
        <Table aria-label={t("admin.machines")}>
          <TableHead>
            <TableRow>
              <TableCell>{t("admin.serialNumber")}</TableCell>
              <TableCell>{t("admin.name")}</TableCell>
              <TableCell>{t("admin.lastUpload")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((machine) => (
              <TableRow
                hover
                key={machine.id}
                role="link"
                tabIndex={0}
                onClick={() => onOpen(machine.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(machine.id);
                  }
                }}
                sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {machine.serialNumber}
                </TableCell>
                <TableCell>{machine.name || "—"}</TableCell>
                <TableCell>
                  {formatDate(machine.lastUploadAt, locale) ?? (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t("admin.noUpload")}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 8, color: "text.secondary" }}>
                  {t("admin.noMachines")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={page.totalElements}
        page={page.page}
        rowsPerPage={page.size}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, next) => changePage(next)}
        onRowsPerPageChange={(event) => changeSize(parseInt(event.target.value, 10))}
      />
    </>
  );
}

export default function AdminMachinesPage() {
  const { machines } = useLoaderData<typeof loader>();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MachineStatus | "all">("all");

  function openMachine(machineId: string) {
    void navigate(`/admin/machines/${machineId}`);
  }

  return (
    <AdminShell
      header={<PageHeading title={t("admin.title")} description={t("admin.subtitle")} />}
    >
      <Card>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
            <TextField
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("admin.search")}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl sx={{ minWidth: 190 }}>
              <InputLabel>{t("admin.status")}</InputLabel>
              <Select
                value={status}
                label={t("admin.status")}
                onChange={(event) => setStatus(event.target.value as MachineStatus | "all")}
              >
                <MenuItem value="all">{t("admin.allStatuses")}</MenuItem>
                {statuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`admin.statusLabels.${value}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Suspense fallback={<MachinesTableSkeleton />}>
            <Await resolve={machines}>
              {(page) => (
                <MachinesTable
                  page={page}
                  search={search}
                  status={status}
                  onOpen={openMachine}
                />
              )}
            </Await>
          </Suspense>
      </Card>
    </AdminShell>
  );
}
