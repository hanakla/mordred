import { ModalManager, ModalEntry, ModalManagerOptions } from "../ModalManager";
import React, {
  Fragment,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IS_SERVER } from "../utils";

type ModalRenderFn = (args: {
  children: ReactNode;
  entry: ModalEntry;
  closeCurrent: () => void;
}) => ReactNode;

export const MordredOut = ({
  children = ({ children }) => children,
  allowMultipleModals,
  disableFocusTrap,
  rootElement,
  zIndex,
}: {
  children?: ModalRenderFn;
} & ModalManagerOptions) => {
  const mordredRef = useRef<ModalManager | null>(null);
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

  useLayoutEffect(() => {
    setMounted(true);

    ModalManager.init({
      allowMultipleModals,
      disableFocusTrap,
      rootElement,
      zIndex,
    });

    mordredRef.current = ModalManager.instance;
    ModalManager.observe(onUpdate);

    return () => ModalManager.unobserve(onUpdate);
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
          instance.rootElement
        )}
      </>
    );
  }

  if (children) {
    return (
      <>
        {createPortal(
          activeEntries.map((entry) => (
            <Fragment key={entry.key}>{children}</Fragment>
          )),
          instance.rootElement
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