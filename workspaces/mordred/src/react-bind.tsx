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
import { IS_SERVER } from "./utils";

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

/**
 * Stable API.
 *
 * But use it "anyplace" in your application makes very complex Modal state.
 * (Maybe, can't keep "Single modal same time". It's not so good UX.)
 * Recommended, `useModalOpener` and pass it returned function to ActionCreator instead.
 */
export const unrecommended_openModal = async <
  C extends ModalComponentType<any, any>
>(
  Component: C,
  props: Omit<PropsTypeOf<C>, "onClose" | "isOpen">,
  { signal }: { signal?: AbortSignal } = {}
) => {
  return new Promise<ResultOfModal<C> | void>((resolve) => {
    const handleAbort = () => {
      entry.close();
      resolve(void 0);
    };

    const entry = Mordred.instance.openModal({
      clickBackdropToClose: !!props.clickBackdropToClose,
      element: createElement(Component, {
        ...props,
        onClose: (result: ResultOfModal<C>) => {
          resolve(result);
          signal?.removeEventListener("abort", handleAbort);
          entry.close();
        },
      }),
    });

    signal?.addEventListener("abort", handleAbort);
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

/**
 * Use `openModal` function in React.

 * Modals mounted by these hooks will be closed when the component is unmounted.
 */
export const useModalOpener = () => {
  const aborts = useRef<AbortController[]>([]);

  const modalOpener = useCallback<typeof unrecommended_openModal>(
    (Component, props, { signal } = {}) => {
      // Will use AbortController, however AbortController is not available in server side. Let guard.
      if (IS_SERVER) {
        throw new Error(
          "Mordred: Can't open modal in Server side, please move openModal inside useEffect or componentDidMount"
        );
      }

      const controller = new AbortController();
      signal?.addEventListener("abort", () => controller.abort());

      const entry = unrecommended_openModal(Component, props, {
        signal: controller.signal,
      });

      aborts.current.push(controller);
      return entry;
    },
    []
  );

  useEffect(() => {
    return () => aborts.current.forEach((controller) => controller.abort());
  }, []);

  return { openModal: modalOpener };
};
