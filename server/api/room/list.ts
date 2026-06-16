import { listRooms } from "#server/utils/room";

export default defineEventHandler(() => {
  return listRooms();
});
