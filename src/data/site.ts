export const person = {
  name: "Aarya Patil",
  role: "Application Developer, IBM",
  city: "Bengaluru",
  timeZone: "Asia/Kolkata",
  email: "aaryap2024@gmail.com",
  github: "https://github.com/Aaryap1",
  linkedin: "https://www.linkedin.com/in/aarya-patil",
};

/** The footer mountain range. The particle journey rebuilds these exact ridges, so keep them shared. */
export const footerRange = { seed: 11, ridges: 7, pixel: 2 };

export const clearbill = {
  live: "https://clearbill-e7sodufiva-el.a.run.app/",
  repo: "https://github.com/Aaryap1/ClearBill",
};

export type Verdict = "clear" | "list1" | "confirm" | "duplicate";

export const verdictLabel: Record<Verdict, string> = {
  clear: "Clear",
  list1: "IRDAI List I",
  confirm: "Confirm",
  duplicate: "Duplicate",
};

export const sampleBill: {
  item: string;
  amount: string;
  verdict: Verdict;
  note: string;
}[] = [
  { item: "Room rent, general ward × 2", amount: "₹4,000", verdict: "clear", note: "" },
  { item: "Consultation, doctor visit", amount: "₹800", verdict: "clear", note: "" },
  { item: "Consultation, doctor visit", amount: "₹800", verdict: "duplicate", note: "Same as line 2" },
  { item: "Admission kit", amount: "₹250", verdict: "list1", note: "Non-payable item" },
  { item: "Gloves, disposable", amount: "₹210", verdict: "list1", note: "Non-payable item" },
  { item: "Nebuliser mask", amount: "₹350", verdict: "confirm", note: "Commonly deducted" },
  { item: "Dressing set", amount: "₹180", verdict: "confirm", note: "Commonly deducted" },
  { item: "Pharmacy", amount: "₹2,850", verdict: "clear", note: "" },
];

export type Work = {
  slug: string;
  title: string;
  summary: string;
  stack: string;
  kind: string;
  year: string;
  live?: string;
};

export const work: Work[] = [
  {
    slug: "clearbill",
    title: "ClearBill",
    summary:
      "Reads a photo of an Indian hospital bill and checks every line against the published rules: IRDAI's non-payable list, NPPA price ceilings, totals and duplicates. Gemini only reads. Plain code judges, and every flag names its rule. Top 100, Patchamomma 2026 Build Phase.",
    stack: "Gemini · Node · Cloud Run · Docker · GitHub Actions",
    kind: "Self-built · live",
    year: "2026",
    live: clearbill.live,
  },
  {
    slug: "ibm-batch",
    title: "Claims batch systems",
    summary:
      "SQL and PL/SQL batch workflows for claims processing and validation at an enterprise BFSI client. I tuned queries and execution plans to cut a batch from 50 to 35 minutes, and automated scheduling and file handling with Control-M and shell scripts.",
    stack: "Oracle · PL/SQL · Control-M · UNIX shell · AWS",
    kind: "IBM · day job",
    year: "2024–now",
  },
  {
    slug: "taxi-pipeline",
    title: "Taxi data pipeline",
    summary:
      "One Airflow DAG takes a month of New York taxi trips from download to tested Snowflake views. It drops impossible trips, loads the rest through a stored connection with no password in code, then dbt builds the models and tests them.",
    stack: "Airflow · Snowflake · dbt · pandas",
    kind: "Self-built",
    year: "2026",
  },
  {
    slug: "fashion-recommender",
    title: "Fashion recommender",
    summary:
      "A team academic project. Photograph a piece of clothing and a Django server returns 8 similar products. ResNet50 turns every catalogue photo into a vector, the nearest 8 win, and LIME shows what the model looked at.",
    stack: "React Native · Django REST · ResNet50 · LIME",
    kind: "Team · academic",
    year: "B.E.",
  },
];
