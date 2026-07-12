import { drive as driveClient, auth } from "@googleapis/drive";
import { prisma } from "@/lib/database/prisma";

const SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"];

function oauthClient() {
  return new auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(state: string) {
  const client = oauthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function connectGoogleDrive(userId: string, code: string) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error("Google tidak mengembalikan token lengkap. Coba hubungkan ulang.");
  }
  client.setCredentials(tokens);

  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const info = await res.json();
  const email = info.email || "";

  await prisma.googleDriveAccount.upsert({
    where: { userId },
    create: {
      userId,
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date),
    },
    update: {
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date),
    },
  });

  return email;
}

export async function getDriveAccount(userId: string) {
  return prisma.googleDriveAccount.findUnique({ where: { userId } });
}

export async function disconnectGoogleDrive(userId: string) {
  await prisma.googleDriveAccount.delete({ where: { userId } }).catch(() => {});
}

export async function getAuthorizedDriveClient(userId: string) {
  const account = await prisma.googleDriveAccount.findUnique({ where: { userId } });
  if (!account) throw new Error("Google Drive belum terhubung");

  const client = oauthClient();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate.getTime(),
  });

  if (account.expiryDate.getTime() <= Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    await prisma.googleDriveAccount.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token!,
        expiryDate: new Date(credentials.expiry_date!),
      },
    });
  }

  return driveClient({ version: "v3", auth: client });
}

export async function uploadBufferToDrive(
  drive: ReturnType<typeof driveClient>,
  { name, mimeType, folderId, buffer }: { name: string; mimeType: string; folderId: string; buffer: Buffer }
) {
  const { Readable } = await import("stream");
  const stream = Readable.from(buffer);
  return drive.files.create({
    requestBody: { name, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: "id",
  });
}
