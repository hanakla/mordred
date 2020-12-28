import { Mordred, MordredEntry } from "../Mordred";
import React, {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
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

export const MordredRenderer = ({
  children = ({ children }) => children,
}: {
  children?: MordalRenderer;
}) => {
  const [mounted, setMounted] = useState(false);
  const [, rerender] = useReducer((s) => s + 1, 0);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const { instance } = Mordred;
  const entries = instance.activeEntries;

  const onUpdate = useCallback(() => {
    if (instance.activeEntries.length > 0 && styleRef.current == null) {
      const style = (styleRef.current = document.createElement("style"));
      style.textContent = "body { overflow: hidden /* Lock by Mordred */; }";
      document.head.appendChild(style);
      (document.activeElement as HTMLElement)?.blur();
      instance.focusTrap?.activate();
    }

    if (instance.activeEntries.length === 0 && styleRef.current != null) {
      styleRef.current.remove();
      styleRef.current = null;
      instance.focusTrap?.deactivate();
    }

    rerender();
  }, []);

  useEffect(() => {
    setMounted(true);

    instance.observe(onUpdate);
    return () => instance.unobserve(onUpdate);
  }, []);

  if (IS_SERVER || !mounted || !instance.rootElement) {
    return <></>;
  }

  if (typeof children === "function") {
    return (
      <>
        {createPortal(
          entries.map((entry) => (
            <Fragment key={entry.key}>
              {children({
                children: entry.element,
                entry,
                closeCurrent: () => entry.close(),
              })}
            </Fragment>
          )),
          Mordred.instance.rootElement!
        )}
      </>
    );
  }

  if (children !== null) {
    return <>{createPortal(children, instance.rootElement)}</>;
  }

  return (
    <>
      {createPortal(
        <>
          {entries.map((entry) => (
            <Fragment key={entry.key}>{entry.element}</Fragment>
          ))}
        </>,
        instance.rootElement
      )}
    </>
  );
};
