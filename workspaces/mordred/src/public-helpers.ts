import { MouseEvent } from "react";

export const whenExactlyClickThen = (
  handler: <T extends MouseEvent>(e: T) => void
) => {
  return (e: MouseEvent) => {
    if (e.currentTarget === e.target) handler(e);
  };
};
