import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { beanOptions, type Recipe } from "~/lib/recipes";

export type RecipeFormValue = Omit<Recipe, "id" | "roastCount">;

const emptyRecipe: RecipeFormValue = {
  name: "",
  description: "",
  shrinkage: null,
  location: "LBN Coffee",
  price: null,
  isBlend: true,
  components: [
    { bean: "Arabica Cau Dat", percentage: 50 },
    { bean: "Robusta Cau Dat", percentage: 50 },
  ],
};

export function RecipeForm({ initialValue = emptyRecipe, submitLabel, onSubmit, onCancel }: {
  initialValue?: RecipeFormValue;
  submitLabel: string;
  onSubmit: (value: RecipeFormValue) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<RecipeFormValue>(initialValue);
  const [error, setError] = useState("");

  function updateComponent(index: number, patch: Partial<(typeof value.components)[number]>) {
    setValue((current) => ({
      ...current,
      components: current.components.map((component, componentIndex) =>
        componentIndex === index ? { ...component, ...patch } : component,
      ),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const total = value.components.reduce((sum, component) => sum + component.percentage, 0);
    if (!value.name.trim()) return setError("Recipe name is required.");
    if (!value.location.trim()) return setError("Location is required.");
    if (total !== 100) return setError("Bean component percentages must add up to 100%.");
    setError("");
    onSubmit({ ...value, name: value.name.trim(), location: value.location.trim() });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Card>
          <CardHeader title="Recipe information" slotProps={{ title: { variant: "h6" } }} />
          <Divider />
          <CardContent sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
            <TextField required autoFocus label="Name" value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} placeholder="e.g. Blend Pha Phin" sx={{ gridColumn: "1 / -1" }} />
            <TextField multiline minRows={3} label="Description" value={value.description} onChange={(event) => setValue({ ...value, description: event.target.value })} placeholder="Add tasting goals or production notes" sx={{ gridColumn: "1 / -1" }} />
            <TextField label="Shrinkage" type="number" value={value.shrinkage ?? ""} onChange={(event) => setValue({ ...value, shrinkage: event.target.value ? Number(event.target.value) : null })} slotProps={{ htmlInput: { min: 0, max: 100, step: 0.1 }, input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
            <TextField required label="Location" value={value.location} onChange={(event) => setValue({ ...value, location: event.target.value })} />
            <TextField label="Price per kg" type="number" value={value.price ?? ""} onChange={(event) => setValue({ ...value, price: event.target.value ? Number(event.target.value) : null })} slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">$</InputAdornment>, endAdornment: <InputAdornment position="end">USD</InputAdornment> } }} />
            <FormControl>
              <InputLabel id="recipe-type-label">Recipe type</InputLabel>
              <Select
                labelId="recipe-type-label"
                label="Recipe type"
                value={value.isBlend ? "blend" : "single"}
                onChange={(event) => {
                  const isBlend = event.target.value === "blend";
                  setValue((current) => ({
                    ...current,
                    isBlend,
                    components: isBlend
                      ? current.components.length > 1
                        ? current.components
                        : [{ ...current.components[0], percentage: 50 }, { bean: beanOptions[1], percentage: 50 }]
                      : [{ ...(current.components[0] ?? { bean: beanOptions[0] }), percentage: 100 }],
                  }));
                }}
              >
                <MenuItem value="single">Single origin</MenuItem>
                <MenuItem value="blend">Blend</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Bean components"
            subheader="Define what goes into this recipe. The total must equal 100%."
            slotProps={{ title: { variant: "h6" } }}
          />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              {value.components.map((component, index) => (
                <Box key={index} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 150px auto" }, gap: 1.5, alignItems: "center", p: 2, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "#FAFAFA" }}>
                  <FormControl>
                    <InputLabel id={`component-${index}-label`}>Component {index + 1}</InputLabel>
                    <Select labelId={`component-${index}-label`} label={`Component ${index + 1}`} value={component.bean} onChange={(event) => updateComponent(index, { bean: event.target.value })}>
                      {beanOptions.map((bean) => <MenuItem key={bean} value={bean}>{bean}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="Percentage" type="number" value={component.percentage} onChange={(event) => updateComponent(index, { percentage: Number(event.target.value) })} slotProps={{ htmlInput: { min: 1, max: 100 }, input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
                  {value.isBlend && value.components.length > 2 ? (
                    <IconButton aria-label={`Remove component ${index + 1}`} onClick={() => setValue({ ...value, components: value.components.filter((_, componentIndex) => componentIndex !== index) })}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  ) : <Box sx={{ width: 40, display: { xs: "none", sm: "block" } }} />}
                </Box>
              ))}

              {value.isBlend && (
                <Box><Button type="button" variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setValue({ ...value, components: [...value.components, { bean: beanOptions[0], percentage: 0 }] })}>Add component</Button></Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" color="inherit" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained">{submitLabel}</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
