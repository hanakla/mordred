import React, {
  ComponentType,
  createElement,
  ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { Mordred } from "./Mordred";
import { createKey } from "./utils";

export type ModalProps<Props = unknown, T = any> = {
  isOpen?: boolean;
  children?: ReactNode;
  clickBackdropToClose?: boolean;
  onAfterOpen?(): void;
  onClose: [T] extends [void] ? () => void : (result: T) => void;
} & Props;

export type ModalComponentType<Props, Result = void> = ComponentType<
  ModalProps<Props, Result>
>;

// prettier-ignore
export type ResultOfModal<
  T extends ModalComponentType<any, any>
> =
  T extends ModalComponentType<infer _, infer R> ? R | void
  : never;

export type PropsTypeOf<T extends ComponentType<any>> = T extends ComponentType<
  infer R
>
  ? R
  : never;

export const openModal = async <C extends ModalComponentType<any, any>>(
  Component: C,
  props: Omit<PropsTypeOf<C>, "onClose" | "isOpen">,
  { abort }: { abort?: AbortSignal } = {}
) => {
  return new Promise<ResultOfModal<C>>((resolve) => {
    const entry = Mordred.instance.openModal({
      key: createKey(),
      clickBackdropToClose: !!props.clickBackdropToClose,
      element: createElement(Component, {
        ...props,
        onClose: (result: ResultOfModal<C>) => {
          resolve(result);
          entry.close();
        },
      }),
    });

    abort?.addEventListener("abort", entry.close);
  });
};

export const useModalsQueue = () => {
  const [, rerender] = useReducer((s) => s + 1, 0);
  const elements = useRef<ReactNode>(null);

  const update = useCallback(() => {
    elements.current = (
      <>{Mordred.instance.activeEntries.map((entry) => entry.element)}</>
    );
    rerender();
  }, []);

  useEffect(() => {
    Mordred.instance.observe(update);
    return () => Mordred.instance.unobserve(update);
  }, [update]);

  return {
    hasModal: Mordred.instance.activeEntries.length != 0,
    modalElements: elements.current,
    modalEntries: Mordred.instance.activeEntries,
  };
};
