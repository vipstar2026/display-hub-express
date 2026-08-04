/**
 * English-keyed admin dictionary.
 *
 * Some admin screens were written with plain English literals instead of the
 * `t("عربي", "English")` pattern. `makeAdminTE(lang)` looks strings up here so
 * those screens follow the selected UI language too.
 *
 * Parts are split per screen-group so they can be maintained independently.
 */

export type EnTr = { ar: string; ur: string; bn: string };

import { DICT_ORDERS } from "./admin-i18n.en.orders";
import { DICT_CODES } from "./admin-i18n.en.codes";
import { DICT_SUPPLY } from "./admin-i18n.en.supply";
import { DICT_CONTENT } from "./admin-i18n.en.content";

export const EN_DICT: Record<string, EnTr> = {
  ...DICT_ORDERS,
  ...DICT_CODES,
  ...DICT_SUPPLY,
  ...DICT_CONTENT,
};
