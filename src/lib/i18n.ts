type TranslationValue = string | Record<string, TranslationValue>;

interface TranslationDictionary {
  [locale: string]: Record<string, TranslationValue>;
}

interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  cookieName: string;
  localStorageKey: string;
}

interface LocaleOption {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

const LOCALES: LocaleOption[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
];

const enTranslations: Record<string, TranslationValue> = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    update: "Update",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    noResults: "No results found",
    search: "Search...",
    filter: "Filter",
    sort: "Sort",
    export: "Export",
    import: "Import",
    copy: "Copy",
    paste: "Paste",
    undo: "Undo",
    redo: "Redo",
  },
  document: {
    untitled: "Untitled",
    newDocument: "New Document",
    deleteDocument: "Delete Document",
    deleteConfirm: "Are you sure you want to delete this document?",
    shareDocument: "Share Document",
    publishDocument: "Publish Document",
    duplicateDocument: "Duplicate Document",
    versionHistory: "Version History",
    wordCount: "{{count}} words",
    characterCount: "{{count}} characters",
    readingTime: "{{minutes}} min read",
    lastEdited: "Last edited {{time}}",
    autoSaved: "Auto-saved",
    saved: "Saved",
    saving: "Saving...",
    unsavedChanges: "Unsaved changes",
  },
  editor: {
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    paragraph: "Paragraph",
    bulletList: "Bullet List",
    numberedList: "Numbered List",
    todoList: "To-do List",
    quote: "Blockquote",
    code: "Code Block",
    image: "Image",
    table: "Table",
    divider: "Divider",
    callout: "Callout",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strikethrough: "Strikethrough",
    inlineCode: "Inline Code",
    highlight: "Highlight",
    link: "Link",
    clearFormatting: "Clear Formatting",
  },
  ai: {
    title: "AI Assistant",
    placeholder: "Ask AI to write or edit...",
    generate: "Generate",
    rewrite: "Rewrite",
    simplify: "Simplify",
    expand: "Expand",
    summarize: "Summarize",
    translate: "Translate",
    fixGrammar: "Fix Grammar",
    improveStyle: "Improve Style",
    continueWriting: "Continue Writing",
    suggestionAccepted: "Suggestion accepted",
    suggestionRejected: "Suggestion rejected",
    quotaRemaining: "{{count}} AI requests remaining",
    quotaExceeded: "AI quota exceeded",
  },
  comment: {
    addComment: "Add a comment",
    reply: "Reply",
    resolve: "Resolve",
    reopen: "Reopen",
    deleteComment: "Delete Comment",
    noComments: "No comments yet",
    mentionSomeone: "Mention someone with @",
  },
  settings: {
    title: "Settings",
    profile: "Profile",
    account: "Account",
    billing: "Billing",
    notifications: "Notifications",
    appearance: "Appearance",
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    systemMode: "System",
  },
  auth: {
    login: "Log In",
    signup: "Sign Up",
    logout: "Log Out",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    orContinueWith: "Or continue with",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
  },
};

const translations: TranslationDictionary = {
  en: enTranslations,
};

class I18nService {
  private config: I18nConfig;
  private currentLocale: string;
  private translations: TranslationDictionary = translations;
  private listeners = new Set<(locale: string) => void>();

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = {
      defaultLocale: config.defaultLocale ?? "en",
      supportedLocales: config.supportedLocales ?? ["en", "es", "fr", "de", "ja", "ko", "zh"],
      fallbackLocale: config.fallbackLocale ?? "en",
      cookieName: config.cookieName ?? "locale",
      localStorageKey: config.localStorageKey ?? "app_locale",
    };

    this.currentLocale = this.getStoredLocale() ?? this.config.defaultLocale;
  }

  private getStoredLocale(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(this.config.localStorageKey);
    } catch {
      return null;
    }
  }

  private storeLocale(locale: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.config.localStorageKey, locale);
    } catch {
      // Storage unavailable
    }
  }

  private getNestedValue(
    obj: Record<string, TranslationValue>,
    path: string
  ): string | undefined {
    const keys = path.split(".");
    let current: TranslationValue = obj;

    for (const key of keys) {
      if (typeof current !== "object" || current === null) return undefined;
      current = (current as Record<string, TranslationValue>)[key];
      if (current === undefined) return undefined;
    }

    return typeof current === "string" ? current : undefined;
  }

  t(key: string, params?: Record<string, string | number>): string {
    let value = this.getNestedValue(
      this.translations[this.currentLocale] ?? {},
      key
    );

    if (value === undefined) {
      value = this.getNestedValue(
        this.translations[this.config.fallbackLocale] ?? {},
        key
      );
    }

    if (value === undefined) return key;

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(
          new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
          String(paramValue)
        );
      }
    }

    return value;
  }

  setLocale(locale: string): void {
    if (!this.config.supportedLocales.includes(locale)) return;

    this.currentLocale = locale;
    this.storeLocale(locale);

    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      const dir = this.getLocaleOption(locale)?.dir ?? "ltr";
      document.documentElement.dir = dir;
    }

    for (const listener of this.listeners) {
      listener(locale);
    }
  }

  getLocale(): string {
    return this.currentLocale;
  }

  getLocales(): LocaleOption[] {
    return LOCALES.filter((l) =>
      this.config.supportedLocales.includes(l.code)
    );
  }

  getLocaleOption(code: string): LocaleOption | undefined {
    return LOCALES.find((l) => l.code === code);
  }

  onLocaleChange(callback: (locale: string) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  addTranslations(locale: string, data: Record<string, TranslationValue>): void {
    this.translations[locale] = {
      ...(this.translations[locale] ?? {}),
      ...data,
    };
  }

  isRTL(): boolean {
    return this.getLocaleOption(this.currentLocale)?.dir === "rtl";
  }

  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(
      new Date(date)
    );
  }

  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(num);
  }

  formatCurrency(
    amount: number,
    currency = "USD",
    options?: Intl.NumberFormatOptions
  ): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: "currency",
      currency,
      ...options,
    }).format(amount);
  }
}

let i18nInstance: I18nService | null = null;

export function getI18n(config?: Partial<I18nConfig>): I18nService {
  if (!i18nInstance) {
    i18nInstance = new I18nService(config);
  }
  return i18nInstance;
}

export function t(key: string, params?: Record<string, string | number>): string {
  return getI18n().t(key, params);
}

export { I18nService };
export type { LocaleOption, I18nConfig };
