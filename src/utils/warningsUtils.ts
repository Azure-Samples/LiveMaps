import { WarningsByLocation, WarningsByRooms, WarningsByLayers, WarningData } from "../models/warningsData";

export const getLayerWarnings = (data: WarningsByLocation, layerId: string, locationId: string) => {
  const locationWarnings: WarningsByRooms | undefined = data[locationId];

  if (!locationWarnings) {
    return [];
  }

  const warnings: WarningData[] = [];

  for (const roomId in locationWarnings) {
    const roomWarnings: WarningsByLayers | undefined = locationWarnings[roomId];

    if (!roomWarnings) {
      continue;
    }

    roomWarnings[layerId]?.forEach((warningData: WarningData, index: number) => {
      warnings.push(warningData);
    });
  }

  return warnings;
}