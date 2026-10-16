import { getSchedule, getConferenceBySlug } from "@/lib/ocs-service";
import ScheduleClient from "./ScheduleClient";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  // SchedConf ID 1 = CITECA 2026
  const scheduleItems = getSchedule(1);
  const conf = getConferenceBySlug("citeca");
  const schedConf = conf?.active_edition;

  return (
    <ScheduleClient
      scheduleItems={scheduleItems}
      conferenceTitle={schedConf?.title || "X CITECA 2026"}
      conferenceCity={schedConf?.city || "Poços de Caldas, MG, Brasil"}
    />
  );
}
