"use client";

import { TrackingEvent, OrderStatus } from "@/lib/types";

const statusOrder: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

const statusLabels: Record<string, string> = {
  pending: "Order Placed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  refunded: "Refunded",
  replacement_sent: "Replacement Sent",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeliveryTimeline({
  events,
  currentStatus,
}: {
  events: TrackingEvent[];
  currentStatus: OrderStatus;
}) {
  const currentStepIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="space-y-0">
      {statusOrder.map((status, index) => {
        const event = events.find((e) => e.status === status);
        const isCompleted = index <= currentStepIndex && event;
        const isCurrent = index === currentStepIndex;
        const isFuture = index > currentStepIndex;

        return (
          <div key={status} className="flex gap-4">
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? isCurrent
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-emerald-500 bg-emerald-500 text-white"
                    : "border-neutral-200 bg-white text-neutral-300"
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-neutral-200" />
                )}
              </div>
              {index < statusOrder.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[48px] ${
                    index < currentStepIndex ? "bg-emerald-500" : "bg-neutral-200"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isFuture ? "opacity-40" : ""}`}>
              <p
                className={`text-sm font-semibold ${
                  isCurrent ? "text-blue-600" : isCompleted ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {statusLabels[status]}
              </p>
              {event ? (
                <>
                  <p className="mt-0.5 text-xs text-neutral-500">{event.description}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    📍 {event.location} • {formatDate(event.timestamp)}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-xs text-neutral-400">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
