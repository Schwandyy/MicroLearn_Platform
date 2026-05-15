"use client";

import {
  Lightbulb,
  Zap,
  Grid3x3,
  Cable,
  Cpu,
  Battery,
  Thermometer,
  Gauge,
  Speaker,
  Camera,
  CircuitBoard,
  Package,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Lightbulb,
  Zap,
  Grid3x3,
  Cable,
  Cpu,
  Battery,
  Thermometer,
  Gauge,
  Speaker,
  Camera,
  CircuitBoard,
  Package,
};

export function PartIcon({
  iconKey,
  className,
}: {
  iconKey?: string | null;
  className?: string;
}) {
  const Icon: LucideIcon =
    (iconKey ? ICONS[iconKey] : undefined) ?? Package;
  return <Icon className={className} />;
}
