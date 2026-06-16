import { getRoom, addToQueue } from "#server/utils/room";
import { getAudioStreamUrl } from "#server/utils/youtube";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "Missing room ID" });

  const room = getRoom(id);
  if (!room)
    throw createError({ statusCode: 404, statusMessage: "Room not found" });

  const body = await readBody<{ videoId: string; addedBy?: string }>(event);
  if (!body?.videoId)
    throw createError({ statusCode: 400, statusMessage: "Missing videoId" });

  let audio;
  try {
    audio = await getAudioStreamUrl(body.videoId);
  } catch (err: any) {
    throw createError({
      statusCode: 422,
      statusMessage: err.message || "Failed to fetch video",
    });
  }

  const song = addToQueue(
    id,
    body.videoId,
    audio.title,
    audio.url,
    body.addedBy || "",
  );
  if (!song)
    throw createError({ statusCode: 500, statusMessage: "Failed to add song" });

  return song;
});
