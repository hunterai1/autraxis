import { Workflow } from "lucide-react";
import { SERVICE_ICONS } from "@/data/content";

const ServiceIcon = ({ slug, size = 22, className = "text-cyanglow" }) => {
  const Icon = SERVICE_ICONS[slug] || Workflow;
  return <Icon size={size} className={className} />;
};

export default ServiceIcon;
