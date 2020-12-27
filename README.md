# @fleur/mordred

`Mordred (モードレッド)` is Perfect React Modal library.

- SSR ready (module is importable in server side)
  - Really works only client side
- Both of JSX style and imperative style
- Can be connect to another React context likes Redux store from Modal
- Type safe

## Usage

```tsx
import { openModal, ModalComponent } from '@fleur/mordred'

// jsx style
const ConfirmModal: ModalComponent<{ message: string }, boolean> = ({ onClose }) => (
  <div>
    {message}
    <button onClick={() => onClose(false)}>Cancel</button>
    <button onClick={() => onClose(true)}>Continute</button>
  </div>
)

const App = () => {
  const [isOpened, setIsOpen] = useState(false)
  const handleClose = (result) => console.log(result)

  return (
    <div id="app-root">
      <Modal>
        <ConfirmModal isOpen={isOpened} onClose={handleClose} message='Sleep?' />
      </Modal>

      {/* Add `MordredRoot` in your app root */}
      <MordredRoot>
        {({ children, entries }) => (
          <Backdrop visible={entries.length > 0}>{children}</Backdrop>
        )}
      </MordredRoot>
    </div>
  )
}

// imperative style
const result = await openModal(ConfirmModal, { message: 'Godmode?' })

```
