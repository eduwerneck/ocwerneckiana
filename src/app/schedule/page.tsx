import { getSchedule, getActiveSchedConf } from "@/lib/ocs-service";
import { parsePositiveInt } from "@/lib/validation";
import ScheduleClient from "./ScheduleClient";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ schedConfId?: string }>;
}) {
  const resolved = await searchParams;
  const requestedId = resolved?.schedConfId ? parsePositiveInt(resolved.schedConfId) ?? undefined : undefined;
  const schedConf = getActiveSchedConf(requestedId);
  const scheduleItems = schedConf ? getSchedule(schedConf.id) : [];

  return (
    <ScheduleClient
      scheduleItems={scheduleItems}
      conferenceTitle={schedConf?.title || "Programação Científica"}
      conferenceCity={schedConf?.city || schedConf?.location || "Brasil"}
    />
  );
}
