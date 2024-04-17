import { ModalManager, ModalEntry, ModalManagerOptions } from "../ModalManager";
import React, {
  Fragment,
  ReactNode,
  useCallback,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IS_SERVER, useIsomorphicLayoutEffect } from "../utils";

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
    if (!mordredRef.current) return;

    const activeEntries = mordredRef.current.activeEntries ?? [];

    if (activeEntries.length > 0 && styleRef.current == null) {
      const style = (styleRef.current = document.createElement("style"));
      style.textContent = "body { overflow: hidden /* Lock by Mordred */; }";
      document.head.appendChild(style);
      mordredRef.current.focusTrap?.activate();
    }

    if (activeEntries.length === 0 && styleRef.current != null) {
      styleRef.current.remove();
      styleRef.current = null;
      mordredRef.current.focusTrap?.deactivate();
    }

    rerender();
  }, []);

  useIsomorphicLayoutEffect(() => {
    ModalManager.init({
      allowMultipleModals,
      disableFocusTrap,
      rootElement,
      zIndex,
    });

    mordredRef.current = ModalManager.instance;
    ModalManager.observe(onUpdate);

    setMounted(true);

    return () => ModalManager.unobserve(onUpdate);
  }, []);

  useIsomorphicLayoutEffect(() => {
    mordredRef.current?.changeSetting({
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
