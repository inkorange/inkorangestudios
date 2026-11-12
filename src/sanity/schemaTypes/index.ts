import { studioFaq } from "./studioFaq";
import { studioGame } from "./studioGame";
import { studioNewsletterDelivery } from "./studioNewsletterDelivery";
import { studioNewsletterIssue } from "./studioNewsletterIssue";
import { studioNewsletterRequest } from "./studioNewsletterRequest";
import { studioPage } from "./studioPage";
import { studioPost } from "./studioPost";
import { studioSettings } from "./studioSettings";
import { studioTool } from "./studioTool";

export const schemaTypes = [
  studioGame,
  studioTool,
  studioPost,
  studioPage,
  studioFaq,
  studioSettings,
  studioNewsletterIssue,
  studioNewsletterRequest,
  studioNewsletterDelivery,
];
