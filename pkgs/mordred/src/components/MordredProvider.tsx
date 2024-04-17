import { Mordred, MordredEntry, MordredOptions } from "../Mordred";
import React, {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IS_SERVER } from "../utils";

type ModalRenderFn = (args: {
  children: ReactNode;
  entry: MordredEntry;
  closeCurrent: () => void;
}) => ReactNode;

export const MordredProvider = ({
  children = ({ children }) => children,
  allowMultipleModals,
  disableFocusTrap,
  rootElement,
  zIndex,
}: {
  children?: ModalRenderFn;
} & MordredOptions) => {
  const mordredRef = useRef<Mordred | null>(null);
  const instance = mordredRef.current;

  const [mounted, setMounted] = useState(false);
  const [, rerender] = useReducer((s) => s + 1, 0);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const activeEntries = instance?.activeEntries ?? [];

  const onUpdate = useCallback(() => {
    if (!instance) return;

    if (activeEntries.length > 0 && styleRef.current == null) {
      const style = (styleRef.current = document.createElement("style"));
      style.textContent = "body { overflow: hidden /* Lock by Mordred */; }";
      document.head.appendChild(style);
      instance.focusTrap?.activate();
    }

    if (activeEntries.length === 0 && styleRef.current != null) {
      styleRef.current.remove();
      styleRef.current = null;
      instance.focusTrap?.deactivate();
    }

    rerender();
  }, []);

  useEffect(() => {
    setMounted(true);

    Mordred.init({
      allowMultipleModals,
      disableFocusTrap,
      rootElement,
      zIndex,
    });

    const instance = (mordredRef.current = Mordred.instance);
    Mordred.instance.observe(onUpdate);

    return () => instance.unobserve(onUpdate);
  }, []);

  useLayoutEffect(() => {
    instance?.changeSetting({
      allowMultipleModals: allowMultipleModals,
      disableFocusTrap: disableFocusTrap,
      zIndex: zIndex,
    });
  }, [allowMultipleModals, disableFocusTrap, zIndex]);

  if (IS_SERVER || !mounted || !instance?.rootElement) {
    return <></>;
  }

  if (typeof children === "function") {
    return (
      <>
        {createPortal(
          activeEntries.map((entry) => (
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

  return (
    <>
      {createPortal(
        <>
          {activeEntries.map((entry) => (
            <Fragment key={entry.key}>{entry.element}</Fragment>
          ))}
        </>,
        instance.rootElement
      )}
    </>
  );
};
