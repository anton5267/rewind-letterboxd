import api from "./axios";

export interface NewsletterSubscription {
  subscribed: boolean;
}

export const getNewsletterSubscription = () =>
  api.get<NewsletterSubscription>("/newsletter/subscription");

export const updateNewsletterSubscription = (subscribed: boolean) =>
  api.put<NewsletterSubscription>("/newsletter/subscription", { subscribed });
