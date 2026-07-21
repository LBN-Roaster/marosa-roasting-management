import { testAlogProfile } from "~/lib/test-alog-profile";

export type RoastStatus = "COMPLETED" | "NEEDS_REVIEW";
export type RoastLevel = "LIGHT" | "MEDIUM_LIGHT" | "MEDIUM" | "DARK";

export type RoastComponent = {
  name: string;
  percentage: number;
};

export type RoastMilestone = {
  seconds: number;
  temperature: number;
};

export type RoastProfilePoint = {
  seconds: number;
  beanTemperature: number;
  exhaustTemperature: number;
  rateOfRise: number;
  burner: number;
  air: number;
  drum: number;
};

export type Roast = {
  id: string;
  recipeName: string;
  components: RoastComponent[];
  roastedAt: string;
  roastedBy: string;
  machine: string;
  overallScore: number | null;
  starred: boolean;
  status: RoastStatus;
  startingMassKg: number;
  endingMassKg: number;
  greenCostPerKg: number | null;
  roastLevel: RoastLevel;
  developmentRatio: number;
  milestones: {
    charge: RoastMilestone;
    turningPoint: RoastMilestone;
    dryEnd: RoastMilestone;
    firstCrackStart: RoastMilestone;
    firstCrackEnd: RoastMilestone | null;
    secondCrackStart: RoastMilestone | null;
    drop: RoastMilestone;
  };
  profileAvailable: boolean;
  profile: RoastProfilePoint[];
};

const sixKgProfile: RoastProfilePoint[] = [
  { seconds: 0, beanTemperature: 198, exhaustTemperature: 212, rateOfRise: 0, burner: 70, air: 25, drum: 65 },
  { seconds: 60, beanTemperature: 108, exhaustTemperature: 196, rateOfRise: 18.8, burner: 78, air: 25, drum: 65 },
  { seconds: 120, beanTemperature: 96, exhaustTemperature: 202, rateOfRise: 15.2, burner: 76, air: 30, drum: 65 },
  { seconds: 180, beanTemperature: 118, exhaustTemperature: 210, rateOfRise: 12.9, burner: 70, air: 35, drum: 65 },
  { seconds: 240, beanTemperature: 141, exhaustTemperature: 216, rateOfRise: 11.4, burner: 64, air: 42, drum: 65 },
  { seconds: 300, beanTemperature: 160, exhaustTemperature: 220, rateOfRise: 9.7, burner: 57, air: 50, drum: 65 },
  { seconds: 360, beanTemperature: 176, exhaustTemperature: 222, rateOfRise: 8.1, burner: 48, air: 58, drum: 65 },
  { seconds: 420, beanTemperature: 189, exhaustTemperature: 219, rateOfRise: 6.8, burner: 38, air: 66, drum: 65 },
  { seconds: 480, beanTemperature: 199, exhaustTemperature: 216, rateOfRise: 5.4, burner: 28, air: 75, drum: 65 },
  { seconds: 540, beanTemperature: 207, exhaustTemperature: 214, rateOfRise: 4.2, burner: 20, air: 82, drum: 65 },
  { seconds: 600, beanTemperature: 213, exhaustTemperature: 217, rateOfRise: 3.1, burner: 12, air: 88, drum: 65 },
  { seconds: 645, beanTemperature: 218, exhaustTemperature: 221, rateOfRise: 2.4, burner: 0, air: 100, drum: 65 },
];

export const initialRoasts: Roast[] = [
  {
    id: "R-260708-049",
    recipeName: "Kenya Kirinyaga Kainamui Peaberry",
    components: [{ name: "Kenya Kirinyaga Kainamui Peaberry", percentage: 100 }],
    roastedAt: "2026-07-08T17:34:59+08:00",
    roastedBy: "—",
    machine: "Kaleido Serial · 0.4 kg",
    overallScore: null,
    starred: false,
    status: "COMPLETED",
    startingMassKg: 0.35,
    endingMassKg: 0.2961,
    greenCostPerKg: null,
    roastLevel: "MEDIUM",
    developmentRatio: 15.7,
    milestones: {
      charge: { seconds: 0, temperature: 193.8 },
      turningPoint: { seconds: 47, temperature: 83.2 },
      dryEnd: { seconds: 290, temperature: 152.6 },
      firstCrackStart: { seconds: 507, temperature: 186.5 },
      firstCrackEnd: null,
      secondCrackStart: null,
      drop: { seconds: 602, temperature: 197.5 },
    },
    profileAvailable: true,
    profile: testAlogProfile,
  },
  {
    id: "R-260721-043",
    recipeName: "Lam Dong Washed Filter",
    components: [{ name: "Arabica Bourbon — Lam Dong", percentage: 100 }],
    roastedAt: "2026-07-21T06:18:00+10:00",
    roastedBy: "minh.tran@marosa.vn",
    machine: "MAROSA-M3-014",
    overallScore: 88,
    starred: true,
    status: "COMPLETED",
    startingMassKg: 3,
    endingMassKg: 2.62,
    greenCostPerKg: 214000,
    roastLevel: "LIGHT",
    developmentRatio: 13.2,
    milestones: {
      charge: { seconds: 0, temperature: 192 }, turningPoint: { seconds: 72, temperature: 91.2 }, dryEnd: { seconds: 278, temperature: 156.4 }, firstCrackStart: { seconds: 514, temperature: 202.8 }, firstCrackEnd: { seconds: 583, temperature: 210.6 }, secondCrackStart: null, drop: { seconds: 602, temperature: 212.1 },
    },
    profileAvailable: true,
    profile: sixKgProfile.map((point) => ({ ...point, beanTemperature: point.beanTemperature - 4, exhaustTemperature: point.exhaustTemperature - 3 })),
  },
  {
    id: "R-260720-038",
    recipeName: "Gia Lai Fine Robusta",
    components: [{ name: "Fine Robusta — Gia Lai", percentage: 100 }],
    roastedAt: "2026-07-20T15:36:00+10:00",
    roastedBy: "linh.nguyen@marosa.vn",
    machine: "MAROSA-M6-021",
    overallScore: null,
    starred: false,
    status: "NEEDS_REVIEW",
    startingMassKg: 6,
    endingMassKg: 5.02,
    greenCostPerKg: 121000,
    roastLevel: "MEDIUM",
    developmentRatio: 17.1,
    milestones: {
      charge: { seconds: 0, temperature: 201 }, turningPoint: { seconds: 80, temperature: 96 }, dryEnd: { seconds: 305, temperature: 159 }, firstCrackStart: { seconds: 548, temperature: 206 }, firstCrackEnd: null, secondCrackStart: null, drop: { seconds: 666, temperature: 222 },
    },
    profileAvailable: true,
    profile: sixKgProfile.map((point) => ({ ...point, seconds: Math.round(point.seconds * 1.03), beanTemperature: point.beanTemperature + 3 })),
  },
  {
    id: "R-260720-031",
    recipeName: "House Espresso 70/30",
    components: [
      { name: "Arabica Catimor — Son La", percentage: 70 },
      { name: "Robusta — Dak Lak", percentage: 30 },
    ],
    roastedAt: "2026-07-20T10:12:00+10:00",
    roastedBy: "quang.le@marosa.vn",
    machine: "MAROSA-M15-006",
    overallScore: 84.75,
    starred: false,
    status: "COMPLETED",
    startingMassKg: 15,
    endingMassKg: 12.7,
    greenCostPerKg: 146000,
    roastLevel: "MEDIUM",
    developmentRatio: 16.4,
    milestones: {
      charge: { seconds: 0, temperature: 205 }, turningPoint: { seconds: 85, temperature: 99 }, dryEnd: { seconds: 318, temperature: 160 }, firstCrackStart: { seconds: 567, temperature: 207 }, firstCrackEnd: { seconds: 642, temperature: 216 }, secondCrackStart: null, drop: { seconds: 688, temperature: 221 },
    },
    profileAvailable: false,
    profile: [],
  },
  {
    id: "R-260719-026",
    recipeName: "Dak Lak Phin Classic",
    components: [{ name: "Robusta — Dak Lak", percentage: 100 }],
    roastedAt: "2026-07-19T13:05:00+10:00",
    roastedBy: "quang.le@marosa.vn",
    machine: "MAROSA-M15-006",
    overallScore: 82.5,
    starred: true,
    status: "COMPLETED",
    startingMassKg: 15,
    endingMassKg: 12.45,
    greenCostPerKg: 112000,
    roastLevel: "DARK",
    developmentRatio: 20.3,
    milestones: {
      charge: { seconds: 0, temperature: 208 }, turningPoint: { seconds: 88, temperature: 101 }, dryEnd: { seconds: 325, temperature: 161 }, firstCrackStart: { seconds: 580, temperature: 208 }, firstCrackEnd: { seconds: 651, temperature: 217 }, secondCrackStart: { seconds: 704, temperature: 224 }, drop: { seconds: 731, temperature: 229 },
    },
    profileAvailable: true,
    profile: sixKgProfile.map((point) => ({ ...point, seconds: Math.round(point.seconds * 1.12), beanTemperature: point.beanTemperature + 7 })),
  },
];
