import { createRoom } from "#server/utils/room";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const title = body?.title as string | undefined;
  const room = createRoom(title);
  return { roomId: room.id, hostToken: room.hostToken, title: room.title };
});
