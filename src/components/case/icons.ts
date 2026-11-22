/** Lucide icon names (from lucide-static) used on case-study pages. */

export const sectionIcon: Record<string, string> = {
  problem: "Target",
  flow: "Route",
  facts: "Gauge",
  shots: "MonitorSmartphone",
  code: "Code",
  decisions: "GitBranch",
  shipping: "Rocket",
  next: "Wrench",
};

export const metaIcon: Record<string, string> = {
  Role: "User",
  Status: "Activity",
  Year: "Calendar",
  Dates: "Calendar",
  When: "Calendar",
  Recognition: "Award",
  Stack: "Layers",
  Runs: "Laptop",
};

/** Pick an icon for a flow step from its "where" line. Order matters: the most specific match wins. */
export function whereIcon(where: string): string {
  const w = where.toLowerCase();
  if (w.includes("secret")) return "KeyRound";
  if (w.includes("plain code")) return "Braces";
  if (/gemini|resnet|model_trained/.test(w)) return "ScanText";
  if (/phone|app\b/.test(w)) return "Smartphone";
  if (/cloud run|server|django/.test(w)) return "Server";
  if (/snowflake|oracle|dbt|static\//.test(w)) return "Database";
  if (w.includes("airflow")) return "Workflow";
  if (/control-m|shell/.test(w)) return "Terminal";
  if (/sit|uat/.test(w)) return "ListChecks";
  if (w.includes("release")) return "Rocket";
  if (w.includes("requirement")) return "FileText";
  return "Cpu";
}
