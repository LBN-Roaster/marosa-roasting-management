export type RecipeComponent = {
  bean: string;
  percentage: number;
};

export type Recipe = {
  id: string;
  name: string;
  description: string;
  shrinkage: number | null;
  location: string;
  price: number | null;
  isBlend: boolean;
  components: RecipeComponent[];
  roastCount: number;
};

export const beanOptions = [
  "Robusta Cau Dat",
  "Arabica Cau Dat",
  "Arabica Quang Tri",
  "Robusta Pha May",
];

export const initialRecipes: Recipe[] = [
  {
    id: "robusta-pha-may",
    name: "Robusta Pha May",
    description: "A clean, structured profile for espresso machine service.",
    shrinkage: 15.2,
    location: "LBN Coffee",
    price: 18,
    isBlend: false,
    components: [{ bean: "Robusta Cau Dat", percentage: 100 }],
    roastCount: 64,
  },
  {
    id: "arabica-v60",
    name: "Arabica V60",
    description: "A bright filter roast with a gentle development phase.",
    shrinkage: 13.8,
    location: "LBN Coffee",
    price: 24,
    isBlend: false,
    components: [{ bean: "Arabica Quang Tri", percentage: 100 }],
    roastCount: 38,
  },
  {
    id: "robusta-pha-phin",
    name: "Robusta Pha Phin",
    description: "Full-bodied Vietnamese phin profile.",
    shrinkage: 16.1,
    location: "LBN Coffee",
    price: 17,
    isBlend: false,
    components: [{ bean: "Robusta Cau Dat", percentage: 100 }],
    roastCount: 91,
  },
  {
    id: "blend-pha-phin",
    name: "Blend Pha Phin",
    description: "Balanced sweetness and body for traditional phin brewing.",
    shrinkage: 15.5,
    location: "LBN Coffee",
    price: 21,
    isBlend: true,
    components: [
      { bean: "Arabica Cau Dat", percentage: 50 },
      { bean: "Robusta Cau Dat", percentage: 50 },
    ],
    roastCount: 100,
  },
];
