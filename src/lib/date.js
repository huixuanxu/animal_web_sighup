export const fmt = (iso) =>
  new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(iso));