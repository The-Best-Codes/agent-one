// TODO: Don't hardcode these somehow? Use Polar API? Hmm...
export const polarProductIds = {
  free: "5c5c6d84-43dc-4a87-9a0f-23ee080af1b7",
  pro: "30fdb516-8321-40db-b7f3-383ff25fca96",
  ultra: "ced74eda-9aeb-4616-9ab4-216eaebd23cd",
  hyper: "0f325a61-6fc7-4613-96b1-4e159ba797f7",
} as const;

const PRODUCT_ID_TO_NAME: Record<string, string> = {
  [polarProductIds.free]: "Free",
  [polarProductIds.pro]: "Pro",
  [polarProductIds.ultra]: "Ultra",
  [polarProductIds.hyper]: "Hyper",
};

export function getPlanNameForProductId(productId: string): string | null {
  return PRODUCT_ID_TO_NAME[productId] ?? null;
}
