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

    const Comp: ModalComponentType<ExtraProps> = component;
    const element = (
      <Comp
        {...(props as ExtraProps)}
        isOpen={rest.isOpen}
        clickBackdropToClose={clickBackdropToClose}
        onClose={handleClose as ModalPropsBase["onClose"]}
      />
    );

    if (entry.current) {
      entry.current.update({
        element,
        clickBackdropToClose,
      });
    } else {
      entry.current = ModalManager.instance.openModal({
        element,
        clickBackdropToClose,
      });
    }
  }, [component, rest.isOpen, clickBackdropToClose]);

  return null;
};
