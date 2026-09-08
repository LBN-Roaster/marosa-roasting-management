import Box from "@mui/material/Box";
import { useSearchParams } from "react-router";
import { PublicHeader } from "~/components/public-header";

export function meta() {
  return [
    { title: "Tool — Profile Creator | MAROSA" },
    {
      name: "description",
      content: "Dựng đường cong rang mục tiêu và xuất profile JSON hoặc Artisan với MAROSA Profile Creator.",
    },
  ];
}

export default function ToolPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: "#FBFCFA" }}>
      <PublicHeader />
      <Box component="main" sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* Keep the standalone engine and its styles isolated from React/MUI. */}
        <Box
          component="iframe"
          title="MAROSA Profile Creator"
          src={`/tools/profile-creator/index.html${query ? `?${query}` : ""}`}
          sx={{ width: "100%", height: "100%", border: 0, bgcolor: "#07110C" }}
        />
      </Box>
    </Box>
  );
}
