import { redirect } from "next/navigation";

/** There is no separate games index: the home page's games section is the list. */
export default function GamesIndex(): never {
  redirect("/#games");
}
