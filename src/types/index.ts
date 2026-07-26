export type Track = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  durationSeconds: number;
  storageUrl: string;
  coverUrl?: string;
  isPremiumOnly: boolean;
};
