# 🌹 @fleur/mordred 🌹

`Mordred (モードレッド)` is Perfect React Modal library at 2021.

## Features

- No dependency on libraries other than React
  - Can use with Fleur, Redux or another React library
- Both of JSX style and imperative style
  - Callable from out of React (likes Action creator)
- Can be connect to another React context likes Redux store from Modal
- Supports backdrop animation
- Tuned rerendering region / performance
- SSR ready (module is importable in server side)
  - Really works only client side
- Type safe

## Usage

See full example code (with single backdrop fade) in [this example](https://github.com/fleur-js/mordred/blob/main/workspaces/example)

### Setup

Add `MordredRoot` into your App root and call `Mordred.init` on after domready

```tsx
import domready from 'domready'
import { Mordret, MordredRoot } from '@fleur/mordred'

const App = () => {
  return (
    <div>
      <MordredRoot>
        {({ children }) => (
          <YourBackdrop>{children}</YourBackdrop>
        )}
      </MordredRoot>
    </div>
  )
}

domready(() => {
  Mordret.init()
  ReactDOM.render(<App />, yourRootElement)
})
```

### Calling your Modal

And define and call ModalComponet to use it up!

```tsx
import { MordredRoot, ModalComponentType } from '@fleur/mordred'

// jsx style
const ConfirmModal: ModalComponentType<{ message: string }, boolean> = ({ onClose }) => (
  <div>
    {message}
    <button onClick={() => onClose(false)}>Cancel</button>
    <button onClick={() => onClose(true)}>Continute</button>
  </div>
)

const SomePage = () => {
  const [isOpened, setIsOpen] = useState(false)
  const handleClose = (result) => console.log(result)

  return (
    <div>
      <Modal>
        <ConfirmModal isOpen={isOpened} onClose={handleClose} message='Sleep?' />
      </Modal>
    </div>
  )
}

// imperative style
import { openModal } from '@fleur/mordred'
const result = await openModal(ConfirmModal, { message: 'Godmode?' })
```
