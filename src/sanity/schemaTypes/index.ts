import { studioFaq } from "./studioFaq";
import { studioGame } from "./studioGame";
import { studioNewsletterDelivery } from "./studioNewsletterDelivery";
import { studioNewsletterIssue } from "./studioNewsletterIssue";
import { studioNewsletterRequest } from "./studioNewsletterRequest";
import { studioPage } from "./studioPage";
import { studioPost } from "./studioPost";
import { studioSettings } from "./studioSettings";

export const schemaTypes = [
  studioGame,
  studioPost,
  studioPage,
  studioFaq,
  studioSettings,
  studioNewsletterIssue,
  studioNewsletterRequest,
  studioNewsletterDelivery,
];
