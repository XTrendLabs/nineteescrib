import {
  BadgePercent,
  CalendarCheck,
  Link2,
  MessageCircle,
} from "lucide-react";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: BadgePercent,
    title: "Zero commission",
    description: "Keep 100% of what your guests pay — no OTA cut, ever.",
  },
  {
    icon: Link2,
    title: "Your own booking link",
    description:
      "Share a Cal.com-grade link on WhatsApp, Instagram, or a QR code.",
  },
  {
    icon: CalendarCheck,
    title: "One calendar, every channel",
    description:
      "Direct, Airbnb, and Booking.com — synced, never double-booked.",
  },
  {
    icon: MessageCircle,
    title: "Built for WhatsApp",
    description: "Confirmations and reminders land where you already work.",
  },
] as const;

export function FeatureShowcase() {
  return (
    <div className="flex h-full flex-col justify-center gap-10 px-12">
      <div>
        <h2 className="text-display-md">
          The booking engine for hosts who bring their own guests
        </h2>
      </div>

      <div className="flex flex-col gap-6">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="flex items-start gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 24,
            }}
          >
            <div className="flex size-10 shrink-0 items-center justify-center border border-primary/20 bg-primary/5 text-primary">
              <feature.icon className="size-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{feature.title}</p>
              <p className="mt-0.5 text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
