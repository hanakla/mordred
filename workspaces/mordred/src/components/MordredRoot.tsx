import { Mordred, MordredEntry } from "../Mordred";
import React, {
  Fragment,
  ReactNode,
  useEffect,
  useReducer,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IS_SERVER } from "../utils";

type MordalRenderer =
  | ReactNode
  | ((args: {
      children: ReactNode;
      entry: MordredEntry;
      closeCurrent: () => void;
    }) => ReactNode);

export const MordredRoot = ({
  children = ({ children }) => children,
}: {
  children?: MordalRenderer;
}) => {
  const [mounted, setMounted] = useState(false);
  const [, rerender] = useReducer((s) => s + 1, 0);

  const context = Mordred.instance;
  const entries = context.activeEntries;

  useEffect(() => {
    setMounted(true);

    context.observe(rerender);
    return () => context.unobserve(rerender);
  }, [rerender]);

  if (IS_SERVER || !mounted || !context.rootElement) {
    return <></>;
  }

  if (typeof children === "function") {
    return (
      <>
        {entries.map((entry) => (
          <Fragment key={entry.key}>
            {children({
              children: entry.element,
              entry,
              closeCurrent: () => entry.close(),
            })}
          </Fragment>
        ))}
      </>
    );
  }

  if (children !== null) {
    return <>{createPortal(children, context.rootElement)}</>;
  }

  return (
    <>
      {createPortal(
        <>
          {entries.map((entry) => (
            <Fragment key={entry.key}>{entry.element}</Fragment>
          ))}
        </>,
        context.rootElement
      )}
    </>
  );
};
