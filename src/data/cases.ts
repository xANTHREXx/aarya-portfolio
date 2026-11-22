/**
 * Case-study content for /work/[slug]/. Every number and claim here must hold up when a reader
 * opens the repo or the live app. Keep ClearBill's two scores separate: the rules were scored on
 * answer-key rows, Gemini's reading on photo-style bills.
 */

export type Step = { where: string; title: string; detail: string; key?: boolean };
export type Fact = { value: string; label: string; note?: string };
export type Shot = { src: string; alt: string; caption: string };
export type Snippet = { title: string; file: string; code: string; note?: string };
export type Decision = { title: string; body: string };
export type Link = { label: string; href: string };
export type Ship = { trigger: string; route: string };

export type CaseStudy = {
  slug: string;
  title: string;
  lead: string;
  meta: { label: string; value: string }[];
  links: Link[];
  problem: string[];
  flowTitle: string;
  flowNote?: string;
  flow: Step[];
  facts: Fact[];
  factsNote?: string;
  shots: Shot[];
  snippets: Snippet[];
  decisions: Decision[];
  shipping: Ship[];
  shippingShot?: Shot;
  next: string[];
  closing?: string;
};

export const cases: CaseStudy[] = [
  {
    slug: "clearbill",
    title: "ClearBill",
    lead: "Reads a photo of an Indian hospital bill and checks every line against the published rules. The model reads. Code judges.",
    meta: [
      { label: "Role", value: "Designed and built solo" },
      { label: "Status", value: "Live on Google Cloud Run" },
      { label: "Year", value: "2026" },
      { label: "Recognition", value: "Top 100 List, Patchamomma 2026 Build Phase" },
      { label: "Stack", value: "Gemini · Node · Docker · Cloud Run · Secret Manager · Firestore · GitHub Actions" },
    ],
    links: [
      { label: "Open the live app", href: "https://clearbill-e7sodufiva-el.a.run.app/" },
      { label: "Backup copy", href: "https://aaryap1.github.io/ClearBill/" },
      { label: "Code on GitHub", href: "https://github.com/Aaryap1/ClearBill" },
    ],
    problem: [
      "Indian hospital bills are long, dense and written for the hospital, not the patient. Yet the rules for checking them are public: IRDAI publishes the items insurers don't pay for, and NPPA publishes legal price ceilings for medicines.",
      "Checking a bill against those rules by hand is slow and easy to get wrong. I wanted a tool where a language model does only what it is good at, reading a messy photo, and plain code does the judging, so every flag can name the rule behind it.",
    ],
    flowTitle: "How one bill gets checked",
    flow: [
      { where: "Phone · index.html", title: "Pick photos of the bill", detail: "The page shrinks them before sending." },
      { where: "Cloud Run · server.js (Node, Docker)", title: "The server guards the API key", detail: "10 MB cap, 60 reads per 10 minutes per person, a queue, at most 2 instances and zero when idle." },
      { where: "Google Secret Manager", title: "Hands the key to the server", detail: "The phone never sees it." },
      { where: "Gemini", title: "Reads the photo into rows", detail: "Temperature 0, JSON out, told to copy every line exactly as printed." },
      { where: "Phone · plain code", title: "Code judges every row", detail: "IRDAI list, NPPA ceilings, totals, duplicates and missing fields. Every flag names its rule.", key: true },
      { where: "Phone", title: "Findings and a drafted letter", detail: "In English, Hindi and Marathi. Saved to Firestore only if the person signs in." },
    ],
    facts: [
      { value: "11 / 11", label: "planted mistakes caught by the rules", note: "On answer-key rows from a synthetic test set of 10 bills." },
      { value: "0", label: "false alarms on the 4 clean bills", note: "Same test set." },
      { value: "251 / 251", label: "lines Gemini read correctly", note: "On photo-style synthetic bills. A separate score from the rules." },
      { value: "Top 100", label: "Patchamomma 2026, Build Phase" },
    ],
    factsNote: "Two separate scores: the rules on perfect rows, and the model's reading of photos. I never add them together.",
    shots: [
      { src: "/img/cb-1-home.jpg", alt: "ClearBill home screen with five 'What happened?' choices", caption: "Start by saying what happened. Five ways in." },
      { src: "/img/cb-2-read.jpg", alt: "Findings tab after reading 8 pasted bill lines totalling 9,440 rupees", caption: "No photo needed for a demo: paste the bill's lines. 8 lines, ₹9,440." },
      { src: "/img/cb-3-flags.jpg", alt: "Findings flagging IRDAI List I charges and charges to confirm", caption: "2 IRDAI List I charges, 2 to confirm, 1 duplicate. Each says what to do." },
      { src: "/img/cb-4-letter-pick.jpg", alt: "Letter tab listing what the letter will include", caption: "Pick what goes in the letter. Only rule-backed items." },
      { src: "/img/cb-5-letter.jpg", alt: "Drafted letter citing IRDAI List I entries for each charge", caption: "The drafted letter names the exact list entry for each charge." },
      { src: "/img/cb-6-hindi.jpg", alt: "The same findings screen in Hindi", caption: "The same screens in Hindi and Marathi." },
    ],
    snippets: [],
    decisions: [
      { title: "The model reads. Code judges.", body: "Gemini only turns the photo into rows. Every judgement is deterministic code that cites a published list, so a flag can be checked by anyone." },
      { title: "Gemini over Document AI for line items", body: "I tried Google Document AI on the same bill. It was strong on form fields but broke line-item tables into fragments, so Gemini does the line extraction." },
      { title: "Unsure means ask, not flag", body: "Charges that are commonly deducted but not on the list are marked 'Confirm with insurer' instead of being flagged as wrong." },
      { title: "The key never reaches the phone", body: "A small Node server holds the Gemini key from Secret Manager and puts size limits, rate limits and a queue in front of it." },
    ],
    shipping: [
      { trigger: "Before any release", route: "node lib/run_gates.js runs every test and exits 1 on any failure" },
      { trigger: "Live site, run by me", route: "deploy.sh → gcloud run deploy --source . → Cloud Build → Cloud Run (asia-south1)" },
      { trigger: "Push to main", route: "pages.yml (GitHub Actions) → backup copy on GitHub Pages" },
      { trigger: "1st of every month", route: "reference-check.yml re-reads the official lists and opens an issue if one changed" },
    ],
    shippingShot: { src: "/img/gh-actions.jpg", alt: "GitHub Actions page with every workflow run green", caption: "GitHub Actions on the ClearBill repo: every run green, including the scheduled monthly check." },
    next: [
      "Run the test gates on every pull request, with branch protection.",
      "Run the container as a non-root user.",
      "Add a .dockerignore.",
      "Move off Node 20.",
    ],
    closing: "Screens are from the live app, using made-up sample bill lines. No real patient data is shown.",
  },
  {
    slug: "ibm-batch",
    title: "Claims batch systems",
    lead: "SQL and PL/SQL batch workflows for claims processing and validation, on high-volume transactional data at an enterprise BFSI client.",
    meta: [
      { label: "Role", value: "Application Developer, IBM" },
      { label: "Dates", value: "Aug 2024 – now" },
      { label: "Stack", value: "Oracle SQL · PL/SQL · Control-M · UNIX shell · AWS (S3, EC2, EMR, CloudWatch)" },
    ],
    links: [],
    problem: [
      "Claims processing runs as scheduled batch jobs over large volumes of transactions. When a batch runs long or fails, work downstream waits, and production failures have to be fixed within an SLA.",
      "I build and maintain the SQL and PL/SQL behind these workflows from business requirements, keep the schedules running, and fix what breaks. Client and system details stay private, so this page describes the work rather than the client.",
    ],
    flowTitle: "How the work runs",
    flow: [
      { where: "Business requirements", title: "Requirements into SQL and PL/SQL", detail: "Claims processing and validation logic for batch workflows." },
      { where: "Control-M · UNIX shell", title: "Scheduling and file handling", detail: "Batch scheduling and file movement automated with Control-M and shell scripts." },
      { where: "Oracle", title: "Query tuning", detail: "Execution plans read and queries reworked where a batch runs long.", key: true },
      { where: "SIT · UAT · regression", title: "Validation in Agile sprints", detail: "Changes and fixes validated across test cycles before release." },
      { where: "Release", title: "Scheduled releases", detail: "Prepared and shipped on the release schedule." },
    ],
    facts: [
      { value: "50 → 35 min", label: "batch runtime", note: "A 30% cut through query tuning and execution-plan optimisation." },
      { value: "−25%", label: "manual effort", note: "Batch scheduling and file handling automated with Control-M and shell scripts." },
      { value: "Within SLA", label: "high-priority production failures fixed", note: "Root-caused across data, SQL and scheduling." },
    ],
    shots: [],
    snippets: [],
    decisions: [
      { title: "Tuning, guided by the execution plan", body: "The 30% runtime cut came from query tuning and execution-plan optimisation on the claims batches." },
      { title: "Hands-on in the cloud migration", body: "In an on-premise-to-cloud migration I managed S3 buckets, processed files in S3, and monitored workloads with CloudWatch, EC2 and EMR." },
      { title: "Root cause across layers", body: "High-priority production failures were root-caused across data, SQL and scheduling, fixed within SLA, and validated through SIT, UAT and regression cycles." },
    ],
    shipping: [],
    next: [],
  },
  {
    slug: "taxi-pipeline",
    title: "Taxi data pipeline",
    lead: "One Airflow DAG takes a month of New York taxi trips from download to tested Snowflake views, with one trigger and no manual steps in between.",
    meta: [
      { label: "Role", value: "Self-built" },
      { label: "Year", value: "2026" },
      { label: "Stack", value: "Apache Airflow · Snowflake · dbt · Python · pandas" },
      { label: "Runs", value: "On my laptop (WSL), triggered by hand" },
    ],
    links: [
      { label: "Airflow repo", href: "https://github.com/Aaryap1/nyc-taxi-airflow-pipeline" },
      { label: "dbt repo", href: "https://github.com/Aaryap1/nyc-taxi-snowflake-dbt" },
    ],
    problem: [
      "I wanted the whole path from raw file to tested model in one place: download, clean, transform, load into a warehouse, then build and test models, with retries and no manual steps.",
      "It uses a fixed-seed sample of one month of New York yellow taxi trips, so every run is repeatable.",
    ],
    flowTitle: "What one run does",
    flowNote: "Every task retries 3 times, 30 seconds apart. If one still fails, nothing after it runs.",
    flow: [
      { where: "Airflow task · download", title: "Take a 50,000-row sample", detail: "January 2024 yellow taxi trips, fixed seed, saved as raw.parquet." },
      { where: "Airflow task · clean", title: "Drop 4,176 impossible trips", detail: "Zero distance, no fare or no passengers. About 8%." },
      { where: "Airflow task · transform", title: "Add 3 columns", detail: "Trip minutes, fare per mile, pickup hour." },
      { where: "Airflow task · load_to_snowflake", title: "Load 45,824 rows into Snowflake", detail: "TAXI_DB.RAW.TAXI_TRIPS, through the stored Airflow connection. No password in code." },
      { where: "Airflow task · run_dbt (shell)", title: "dbt builds and tests the views", detail: "Staging view, then an hourly summary (24 rows), then 3 tests. dbt runs in its own Python 3.12 environment.", key: true },
    ],
    facts: [
      { value: "50,000", label: "rows sampled", note: "January 2024 yellow taxi trips, fixed seed." },
      { value: "4,176", label: "impossible trips dropped", note: "About 8% of the sample." },
      { value: "45,824", label: "rows loaded into Snowflake" },
      { value: "3", label: "dbt tests on every run", note: "not_null and unique on the staging view and hourly summary." },
    ],
    shots: [
      { src: "/img/sf-loaded.png", alt: "Snowflake confirming 45,824 rows loaded into TAXI_DB.RAW.TAXI_TRIPS", caption: "My first load of the cleaned sample, done by hand in Snowflake's web page on 26 Jun 2026. Airflow now does this step itself." },
    ],
    snippets: [
      {
        title: "Retries and schedule",
        file: "dags/taxi_pipeline.py",
        code: 'default_args = {"retries": 3, "retry_delay": timedelta(seconds=30)}\n\n@dag(schedule="@daily", start_date=datetime(2024, 1, 1),\n     catchup=False, default_args=default_args)\ndef taxi_pipeline():',
      },
      {
        title: "The wiring sets the order",
        file: "dags/taxi_pipeline.py",
        code: "transformed = transform(clean(download()))\nload = load_to_snowflake(transformed)\nload >> run_dbt",
        note: "Each task returns a file path, not the data. >> means 'run after'.",
      },
      {
        title: "Login by name, safe to re-run",
        file: "dags/taxi_pipeline.py",
        code: 'hook = SnowflakeHook(snowflake_conn_id="snowflake_default")\nconn = hook.get_conn()\nsuccess, nchunks, nrows, _ = write_pandas(\n    conn, df, "TAXI_TRIPS",\n    auto_create_table=True, overwrite=True\n)',
        note: "overwrite=True replaces the table, so running twice doesn't double the rows.",
      },
      {
        title: "Summary model",
        file: "models/daily_hourly_summary.sql",
        code: "SELECT\n    pickup_hour,\n    COUNT(*)                     AS total_trips,\n    ROUND(AVG(fare_amount), 2)   AS avg_fare,\n    ROUND(AVG(duration_min), 2)  AS avg_duration_min,\n    ROUND(AVG(trip_distance), 2) AS avg_distance\nFROM {{ ref('stg_taxi_trips') }}\nGROUP BY pickup_hour",
        note: "ref() tells dbt to build the staging view first.",
      },
      {
        title: "Data-quality tests",
        file: "models/schema.yml",
        code: "- name: stg_taxi_trips\n  columns:\n    - name: vendor_id\n      tests: [not_null]\n- name: daily_hourly_summary\n  columns:\n    - name: pickup_hour\n      tests: [not_null, unique]",
      },
    ],
    decisions: [
      { title: "Credentials stay out of code", body: "Snowflake is reached through a stored Airflow connection, referred to by name." },
      { title: "dbt in its own environment", body: "dbt runs as a shell task in a separate Python 3.12 environment, so Airflow's and dbt's dependencies never fight." },
      { title: "Safe to run twice", body: "The load overwrites the table, so a retry or a second run leaves the same 45,824 rows." },
    ],
    shipping: [],
    next: [],
  },
  {
    slug: "fashion-recommender",
    title: "Fashion recommender",
    lead: "Photograph a piece of clothing in the mobile app, and the server finds 8 similar products with brand and price, plus a picture of what the model focused on.",
    meta: [
      { label: "Role", value: "Team academic project" },
      { label: "When", value: "B.E. Computer Science" },
      { label: "Stack", value: "React Native · Firebase Auth · Django REST · ResNet50 · scikit-learn · LIME" },
    ],
    links: [],
    problem: [
      "Searching a catalogue by words is hard when all you have is a picture of what you want. We built a recommender that searches by image instead, and shows why it picked what it picked.",
      "This was a team project, so this page describes how the system works.",
    ],
    flowTitle: "How it works",
    flowNote: "Steps 1 and 2 run once, offline. Steps 3 to 6 run on every request.",
    flow: [
      { where: "model_trained.py", title: "Turn every catalogue photo into a vector", detail: "ResNet50, already trained on millions of images." },
      { where: "static/", title: "Save the vectors", detail: "embeddings.pkl and filenames.pkl, loaded when the server starts." },
      { where: "Phone app", title: "Sign in and pick a photo", detail: "Firebase Auth, then the Search tab posts to /api/recommend." },
      { where: "Django server", title: "Turn your photo into a vector", detail: "The same ResNet50 model." },
      { where: "Django server", title: "Find the nearest vectors", detail: "Clothes that look alike sit close together. Keep 8." },
      { where: "Django server → phone", title: "Explain and show", detail: "LIME marks what the model looked at. Name, brand and price come from the dataset. 8 cards appear.", key: true },
    ],
    facts: [
      { value: "8", label: "similar products per photo" },
      { value: "1", label: "model for catalogue and query", note: "The same ResNet50 turns both into vectors, so they can be compared." },
    ],
    shots: [],
    snippets: [],
    decisions: [
      { title: "Vectors computed once", body: "The catalogue is turned into vectors offline and loaded at start-up, so a request only has to process one photo." },
      { title: "Explain the match", body: "LIME highlights the part of the photo the model relied on, so a user can see why a product was suggested." },
    ],
    shipping: [],
    next: [],
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
