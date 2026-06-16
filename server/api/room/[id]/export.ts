import { exportRoom } from "#server/utils/room";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id)
    throw createError({ statusCode: 400, statusMessage: "Missing room ID" });

  const data = exportRoom(id);
  if (!data)
    throw createError({ statusCode: 404, statusMessage: "Room not found" });

  return data;
});
