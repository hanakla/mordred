import React, { useCallback, useEffect, useRef } from "react";
import {
  ModalComponentType,
  PropsTypeOf,
  ModalPropsBase,
  ResultOfModal,
} from "../react-bind";
import { ModalManager, ModalEntry } from "../ModalManager";
import { usePrevious } from "../utils";

export const Modal = <
  C extends ModalComponentType<any, any>,
  ExtraProps extends Omit<PropsTypeOf<C>, keyof ModalPropsBase>
>({
  component,
  props,
  clickBackdropToClose = true,
  ...rest
}: ModalPropsBase<
  {
    component: C;
    props: ExtraProps;
    isOpen?: boolean;
  },
  ResultOfModal<C>
>) => {
  const prevIsOpen = usePrevious(rest.isOpen);
  const entry = useRef<ModalEntry | null>(null);

  const handleClose = useCallback(
    (result: any) => {
      entry.current?.close();
      rest.onClose?.(result);
    },
    [rest.onClose]
  );

  useEffect(() => {
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
        clickBackdropToClose: clickBackdropToClose,
      });
    } else {
      const Comp: ModalComponentType<ExtraProps> = component;

      entry.current = ModalManager.instance.openModal({
        element: (
          <Comp
            {...(props as ExtraProps)}
            isOpen={rest.isOpen}
            children={rest.children}
            clickBackdropToClose={clickBackdropToClose}
            onClose={handleClose as ModalPropsBase["onClose"]}
          />
        ),
      });
    }
  }, [component, rest.isOpen, clickBackdropToClose]);

  return null;
};
