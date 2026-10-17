import { useContent } from "@/content/ContentContext";
import { services, solutions, projects, insights } from "@/data/content";

const pick = (bundle, key, fallback) =>
  bundle && Array.isArray(bundle[key]) && bundle[key].length ? bundle[key] : fallback;

export const useServices = () => pick(useContent(), "services", services);
export const useSolutions = () => pick(useContent(), "solutions", solutions);
export const useProjects = () => pick(useContent(), "projects", projects);
export const useInsights = () => pick(useContent(), "insights", insights);
