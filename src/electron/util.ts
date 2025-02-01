export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export enum MODEL_TYPE {
  ASKVOX = "ASKVOX",
  GPT_4o = "GPT_4o",
}
