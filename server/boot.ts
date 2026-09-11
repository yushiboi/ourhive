import { fromSpellbee, loadDailyCatalog, puzzleStats } from "./spellbee.ts";
import { RoomStore } from "./rooms.ts";

export const store = new RoomStore();

loadDailyCatalog()
  .then((dates) => {
    const days = Object.keys(dates).sort();
    console.log(`Spellbee published days: ${days.join(", ") || "(none)"}`);
    const latestDay = days.at(-1);
    const latest = latestDay ? dates[latestDay] : undefined;
    if (latestDay && latest) {
      console.log("Latest hive", puzzleStats(fromSpellbee(latest, "daily", latestDay)));
    }
  })
  .catch((err: unknown) => {
    console.warn("Could not prefetch Spellbee dailies:", err);
  });
