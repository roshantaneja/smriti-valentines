This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Photo Sources

Photos can come from two places:

### Option 1: Local folder (default)

Add images to `public/photos/` — supported: jpg, jpeg, png, gif, webp, heic. Redeploy to see new photos.

### Option 2: Google Drive folder

1. **Create a Google Cloud project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a project

2. **Enable the Drive API**
   - APIs & Services → Library → search "Google Drive API" → Enable

3. **Create a service account**
   - APIs & Services → Credentials → Create credentials → Service account
   - Give it a name (e.g. "Valentines Photos") → Create
   - Skip optional steps → Done
   - Click the service account → Keys → Add key → Create new key → JSON → Download

4. **Share your Drive folder**
   - Create a folder in Google Drive, add your photos
   - Right-click the folder → Share
   - Add the service account email (from the JSON: `client_email`) as a Viewer
   - Also set the folder to "Anyone with the link" can view (so images load for visitors)

5. **Get the folder ID**
   - Open the folder in Drive
   - The URL is `https://drive.google.com/drive/folders/FOLDER_ID` — copy the `FOLDER_ID` part

6. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Set `GOOGLE_DRIVE_FOLDER_ID` to your folder ID
   - Set `GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL` from the JSON
   - Set `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — paste the full key, keep the `\n` for newlines

7. **On Vercel**: Add the same env vars in Project Settings → Environment Variables

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
