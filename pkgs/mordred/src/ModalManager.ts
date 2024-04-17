import { createFocusTrap, FocusTrap } from "focus-trap";
import { ReactNode } from "react";
import { createKey, IS_SERVER } from "./utils";

export type MordredEntryOption = {
  key?: string;
  element: ReactNode;
  clickBackdropToClose?: boolean;
  options?: any;
};

export class ModalEntry {
  constructor(
    public readonly key: string,
    private options: MordredEntryOption,
    private updated: () => void,
    private destroyed: (entry: ModalEntry) => void
  ) {}

  public get element() {
    return this.options.element;
  }

  public get clickBackdropToClose() {
    return !!this.options.clickBackdropToClose;
  }

  public update(options: Partial<MordredEntryOption>) {
    Object.assign(this.options, options);
    this.updated();
  }

  public close() {
    this.destroyed(this);
  }
}

export interface ModalManagerOptions {
  rootElement?: HTMLElement;
  zIndex?: number;
  allowMultipleModals?: boolean;
  disableFocusTrap?: boolean;
}

export class ModalManager {
  public static _instance: ModalManager;
  private static observer: Set<() => void> = new Set();

  public static observe(listener: () => void) {
    this.observer.add(listener);
  }

  public static unobserve(listener: () => void) {
    this.observer.delete(listener);
  }

  public static get instance() {
    if (!ModalManager._instance) {
      throw new Error(
        "Mordred: Mordred is not initialized, Please call `Mordred.init` first"
      );
    }
    return ModalManager._instance;
  }

  public static init(options: ModalManagerOptions = {}) {
    if (ModalManager._instance) return;
    ModalManager._instance = new ModalManager(options);
  }

  public rootElement: HTMLElement | null = null;
  public focusTrap: FocusTrap | null = null;
  private modals: Map<string, ModalEntry> = new Map();
  private activeEntriesCache: ModalEntry[] = [];
  private options: ModalManagerOptions;

  constructor(options: ModalManagerOptions = {}) {
    this.options = options;

    if (IS_SERVER) return;

    if (options.rootElement) {
      this.rootElement = options.rootElement;
    } else {
      const div = (this.rootElement = document.createElement("div"));
      div.className = "mordred-out";
      div.style.display = "contents";
      document.body.appendChild(div);
    }

    this.initFocusTrap();
    this.focusTrap?.deactivate();
  }

  public openModal(option: Omit<MordredEntryOption, "key">) {
    if (IS_SERVER) {
      throw new Error(
        "Mordred: Can't open modal in Server side, please move openModal inside useEffect or componentDidMount"
      );
    }

    const key = createKey();

    const entry = new ModalEntry(
      key,
      { key, ...option },
      () => this.dispatchUpdate(),
      (entry) => this.destroyModal(entry.key)
    );

    this.modals.set(key, entry);
    this.activeEntriesCache = Array.from(this.modals.values());
    this.dispatchUpdate();

    return entry;
  }

  public changeSetting(
    option: Partial<Omit<ModalManagerOptions, "rootElement">>
  ) {
    this.options.allowMultipleModals = !!option.allowMultipleModals;
    this.options.zIndex = option.zIndex;

    if (this.options.disableFocusTrap && !option.disableFocusTrap) {
      this.initFocusTrap();
    }

    if (!this.options.disableFocusTrap && option.disableFocusTrap) {
      this.focusTrap?.deactivate();
      this.focusTrap = null;
    }

    this.options.disableFocusTrap =
      option.disableFocusTrap ?? this.options.disableFocusTrap;

    this.dispatchUpdate();
  }

  private destroyModal(key: string) {
    this.modals.delete(key);
    this.activeEntriesCache = Array.from(this.modals.values());
    this.dispatchUpdate();
  }

  private recache() {
    const entries = Array.from(this.modals.values());

    this.activeEntriesCache = this.options.allowMultipleModals
      ? entries
      : entries.slice(-1);
  }

  public get activeEntries() {
    return this.activeEntriesCache;
  }

  private initFocusTrap() {
    this.focusTrap = createFocusTrap(this.rootElement!, {
      fallbackFocus: this.rootElement!,
    });
  }

  private dispatchUpdate() {
    if (IS_SERVER) return;

    this.recache();
    ModalManager.observer.forEach((observer) => observer());
  }
}
