import { createFocusTrap, FocusTrap } from "focus-trap";
import { ReactNode } from "react";
import { createKey, IS_SERVER } from "./utils";

export type MordredEntryOption = {
  key?: string;
  element: ReactNode;
  onAfterOpen?: () => void;
  clickBackdropToClose?: boolean;
  options?: any;
};

export class MordredEntry {
  constructor(
    public readonly key: string,
    private options: MordredEntryOption,
    private updated: () => void,
    private destroyed: (entry: MordredEntry) => void
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

interface Options {
  rootElement?: HTMLElement;
  zIndex?: number;
  allowMultipleModals?: boolean;
  disableFocusTrap?: boolean;
}

export class Mordred {
  public static _instance: Mordred;

  public static get instance() {
    if (!Mordred._instance) {
      throw new Error(
        "Mordred: Mordred is not initialized, Please call `Mordred.init` first"
      );
    }
    return Mordred._instance;
  }

  public static init(options: Options = {}) {
    if (Mordred._instance) throw new Error("Mordred is already initialized");
    Mordred._instance = new Mordred(options);
  }

  public rootElement: HTMLElement | null = null;
  public focusTrap: FocusTrap | null = null;
  private modals: Map<string, MordredEntry> = new Map();
  private activeEntriesCache: MordredEntry[] = [];
  private options: Options;
  private observer: Set<() => void> = new Set();

  constructor(options: Options = {}) {
    this.options = options;

    if (IS_SERVER) return;

    if (options.rootElement) {
      this.rootElement = options.rootElement;
    } else {
      const div = (this.rootElement = document.createElement("div"));
      div.className = "mordred-context";

      Object.assign(div.style, {
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: options.zIndex ?? Number.MAX_SAFE_INTEGER,
        display: "block",
        height: "0",
        width: "0",
        overflow: "visible",
      });

      document.body.appendChild(div);
    }

    if (!options.disableFocusTrap) {
      this.initFocusTrap();
    }
  }

  public openModal(option: Omit<MordredEntryOption, "key">) {
    if (IS_SERVER) {
      throw new Error(
        "Mordred: Can't open modal in Server side, please move openModal inside useEffect or componentDidMount"
      );
    }

    const key = createKey();

    const entry = new MordredEntry(
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

  public changeSetting(option: Partial<Omit<Options, "rootElement">>) {
    this.options.allowMultipleModals = !!option.allowMultipleModals;
    this.options.zIndex = option.zIndex;

    if (this.options.disableFocusTrap && !option.disableFocusTrap) {
      this.initFocusTrap();
    }

    if (!this.options.disableFocusTrap && option.disableFocusTrap) {
      this.focusTrap?.deactivate();
      this.focusTrap = null;
    }

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

  public observe(listener: () => void) {
    this.observer.add(listener);
  }

  public unobserve(listener: () => void) {
    this.observer.delete(listener);
  }

  private initFocusTrap() {
    this.focusTrap = createFocusTrap(this.rootElement!, {
      fallbackFocus: this.rootElement!,
    });
  }

  private dispatchUpdate() {
    if (IS_SERVER) return;

    this.recache();
    this.observer.forEach((observer) => observer());
  }
}
