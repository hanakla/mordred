import React, { useCallback, useLayoutEffect, useRef } from "react";
import {
  ModalComponentType,
  PropsTypeOf,
  ModalProps,
  ResultOfModal,
} from "../react-bind";
import { Mordred, MordredEntry } from "../Mordred";
import { usePrevious } from "../utils";

export const Modal = <
  C extends ModalComponentType<any, any>,
  ExtraProps extends Omit<PropsTypeOf<C>, keyof ModalProps>
>({
  component,
  props,
  clickBackdropToClose = true,
  ...rest
}: ModalProps<
  {
    component: C;
    props: ExtraProps;
  },
  ResultOfModal<C>
>) => {
  const prevIsOpen = usePrevious(rest.isOpen);
  const entry = useRef<MordredEntry | null>(null);

  const handleClose = useCallback(
    (result: any) => {
      entry.current?.close();
      rest.onClose?.(result);
    },
    [rest.onClose]
  );

  useLayoutEffect(() => {
    if (prevIsOpen.previous !== rest.isOpen) {
      // Change to close
      if (rest.isOpen == false) {
        entry.current?.close();
        entry.current = null;
      }
    }

    if (!rest.isOpen) return;

    if (entry.current) {
      entry.current.update({
        element: rest.children,
        onAfterOpen: rest.onAfterOpen,
        clickBackdropToClose: clickBackdropToClose,
      });
    } else {
      const Comp: ModalComponentType<ExtraProps> = component;

      entry.current = Mordred.instance.openModal({
        element: (
          <Comp
            {...(props as ExtraProps)}
            isOpen={rest.isOpen}
            children={rest.children}
            onAfterOpen={rest.onAfterOpen}
            clickBackdropToClose={clickBackdropToClose}
            onClose={handleClose as ModalProps["onClose"]}
          />
        ),
      });
    }
  }, [component, rest.isOpen, clickBackdropToClose]);

  return null;
};
