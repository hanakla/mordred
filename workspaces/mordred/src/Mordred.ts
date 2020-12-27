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
  rootElement?: Element;
  zIndex?: number;
  allowMultipleModals?: boolean;
}

export class Mordred {
  public static instance: Mordred;

  public static init(options: Options = {}) {
    if (Mordred.instance) throw new Error("Mordred is already initialized");
    Mordred.instance = new Mordred(options);
  }

  public rootElement: Element | null = null;
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
        position: "absolute",
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
  }

  public openModal(option: MordredEntryOption) {
    if (IS_SERVER) {
      throw new Error(
        "Mordred: Can't open modal in Server side, please move openModal inside useEffect or componentDidMount"
      );
    }

    const key = option.key ?? createKey();

    const entry = new MordredEntry(
      key,
      option,
      () => this.observer.forEach((o) => o()),
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

  private dispatchUpdate() {
    this.recache();
    this.observer.forEach((observer) => observer());
  }
}
