export const DEFAULT_TEMPLATE_EN = `Dear {guest_name},

We would like to invite you to celebrate our special day:

✨ {groom_name} & {bride_name} ✨

Please open your personal invitation via the link below:
{invitation_url}

It would be our greatest joy to have you with us on this day.

Thank you. 🙏`;

const DEFAULT_TEMPLATE = `Halo {guest_name},

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami:

✨ {groom_name} & {bride_name} ✨

Silakan buka undangan melalui link berikut:
{invitation_url}

Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih. 🙏`;

export const DEFAULT_TEMPLATE_SANGJIT = `Halo {guest_name},

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara Sangjit kami:

✨ {groom_name} & {bride_name} ✨

Silakan buka undangan melalui link berikut:
{invitation_url}

Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih. 🙏`;

export const DEFAULT_TEMPLATE_SANGJIT_EN = `Dear {guest_name},

We cordially invite you to join our Sangjit ceremony:

✨ {groom_name} & {bride_name} ✨

Please open your personal invitation via the link below:
{invitation_url}

We would be honored to have you with us on this special day.

Thank you. 🙏`;

export const DEFAULT_TEMPLATE_LAMARAN = `Halo {guest_name},

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara Lamaran kami:

✨ {groom_name} & {bride_name} ✨

Silakan buka undangan melalui link berikut:
{invitation_url}

Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih. 🙏`;

export const DEFAULT_TEMPLATE_LAMARAN_EN = `Dear {guest_name},

We cordially invite you to our Engagement ceremony:

✨ {groom_name} & {bride_name} ✨

Please open your personal invitation via the link below:
{invitation_url}

We would be honored to have your presence and blessings.

Thank you. 🙏`;

export function getDefaultTemplate(clientType: string): string {
  if (clientType === "SANGJIT") return DEFAULT_TEMPLATE_SANGJIT;
  if (clientType === "LAMARAN") return DEFAULT_TEMPLATE_LAMARAN;
  return DEFAULT_TEMPLATE;
}

export function getDefaultTemplateEn(clientType: string): string {
  if (clientType === "SANGJIT") return DEFAULT_TEMPLATE_SANGJIT_EN;
  if (clientType === "LAMARAN") return DEFAULT_TEMPLATE_LAMARAN_EN;
  return DEFAULT_TEMPLATE_EN;
}

interface TemplateVars {
  guest_name: string;
  groom_name: string;
  bride_name: string;
  client_name: string;
  event_date: string;
  invitation_url: string;
  max_pax: number;
}

export function renderWhatsappMessage(
  template: string | null,
  vars: TemplateVars
): string {
  const tpl = template || DEFAULT_TEMPLATE;
  return tpl
    .replace(/{guest_name}/g, vars.guest_name)
    .replace(/{groom_name}/g, vars.groom_name)
    .replace(/{bride_name}/g, vars.bride_name)
    .replace(/{client_name}/g, vars.client_name)
    .replace(/{event_date}/g, vars.event_date)
    .replace(/{invitation_url}/g, vars.invitation_url)
    .replace(/{max_pax}/g, String(vars.max_pax));
}

export function buildWhatsappLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const normalized = cleaned.startsWith("0")
    ? "62" + cleaned.slice(1)
    : cleaned;
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}

export { DEFAULT_TEMPLATE };
