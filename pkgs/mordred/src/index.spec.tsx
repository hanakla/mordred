import { useCallback } from "react";
import { openModal, Modal, ModalComponentType } from "./";

describe("Test", () => {
  const ConfirmModal: ModalComponentType<boolean, unknown> = ({
    children,
    onClose,
  }) => {
    return (
      <div>
        {children}
        <button onClick={() => onClose(false)}>Cancel</button>
        <button onClick={() => onClose(true)}>Continue</button>
      </div>
    );
  };

  it("jsx style", () => {
    const App = () => {
      const handleClose = useCallback((value: boolean) => {
        console.log(value);
      }, []);

      return (
        <Modal>
          <ConfirmModal isOpen={true} onClose={handleClose}>
            <strong>IS THE ORDER A RABBIT??</strong>
          </ConfirmModal>
        </Modal>
      );
    };
  });

  it("imperative style", async () => {
    const result = await openModal(ConfirmModal, {
      children: "IS THE ORDER A RABBIT?",
    });
  });
});
